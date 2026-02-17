const getReactPipeline = () => `
pipeline {
    agent any

    parameters {
        string(name: 'GIT_REPO', defaultValue: '', description: 'Git repository URL')
        string(name: 'BRANCH', defaultValue: 'main', description: 'Git branch')
        string(name: 'ACTION', defaultValue: 'deploy', description: 'Action to perform')
        string(name: 'ENV', defaultValue: 'dev', description: 'Target environment')
        string(name: 'OUTPUT_PATH', defaultValue: '/var/www/html', description: 'Deployment destination')
    }

    stages {
        stage('Checkout') {
            steps {
                script {
                    def gitRepo = params.GIT_REPO ?: env.GIT_REPO ?: ''
                    def gitBranch = params.BRANCH ?: env.BRANCH ?: 'main'
                    
                    if (gitRepo) {
                        git branch: gitBranch, url: gitRepo
                    } else {
                        error('GIT_REPO parameter is required')
                    }
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'npm ci || npm install'
                    } else {
                        bat 'npm ci || npm install'
                    }
                }
            }
        }

        stage('Run Tests') {
            when {
                expression { params.ACTION == 'test' }
            }
            steps {
                script {
                    try {
                        if (isUnix()) {
                            sh 'npm test'
                        } else {
                            bat 'npm test'
                        }
                    } catch (err) {
                        echo 'Tests failed!'
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }

        stage('Build') {
             when {
                expression { params.ACTION == 'deploy' }
            }
            steps {
                script {
                    if (isUnix()) {
                        sh 'npm run build'
                    } else {
                        bat 'npm run build'
                    }
                }
            }
        }

        stage('Deploy') {
            when {
                expression { params.ACTION == 'deploy' }
            }
            steps {
                script {
                    echo "Deploying React App to \${params.ENV}..."
                    def targetPath = params.OUTPUT_PATH
                    
                    if (isUnix()) {
                        sh "mkdir -p \${targetPath}"
                        sh "cp -R build/* \${targetPath} || cp -R dist/* \${targetPath}"
                    } else {
                        // robocopy <source> <destination> [file [file]...] [options]
                        // /E : copies subdirectories, including empty ones.
                        // /NJH /NJS : suppress job header and summary for cleaner logs.
                        // robocopy returns 1 on success (files copied), 0 on no files. 
                        // Anything < 8 is generally a success for robocopy.
                        bat """
                            if not exist "\${targetPath}" mkdir "\${targetPath}"
                            robocopy build "\${targetPath}" /E /NJH /NJS /MT /R:3 /W:5 || (if %ERRORLEVEL% LEQ 8 exit 0 else exit %ERRORLEVEL%)
                        """
                        // Fallback check for 'dist' folder if 'build' doesn't exist
                        bat """
                            if exist dist (
                                robocopy dist "\${targetPath}" /E /NJH /NJS /MT /R:3 /W:5 || (if %ERRORLEVEL% LEQ 8 exit 0 else exit %ERRORLEVEL%)
                            )
                        """
                    }
                    echo "Build artifacts successfully deployed to \${targetPath}"
                }
            }
        }
    }
}
`;


const getNodePipeline = () => `
pipeline {
    agent any

    parameters {
        string(name: 'GIT_REPO', defaultValue: '', description: 'Git repository URL')
        string(name: 'BRANCH', defaultValue: 'main', description: 'Git branch')
        string(name: 'ACTION', defaultValue: 'deploy', description: 'Action to perform')
        string(name: 'ENV', defaultValue: 'dev', description: 'Target environment')
        string(name: 'OUTPUT_PATH', defaultValue: '/var/www/html', description: 'Deployment destination')
    }

    stages {
        stage('Checkout') {
            steps {
                script {
                    def gitRepo = params.GIT_REPO ?: env.GIT_REPO ?: ''
                    def gitBranch = params.BRANCH ?: env.BRANCH ?: 'main'
                    
                    if (gitRepo) {
                        git branch: gitBranch, url: gitRepo
                    } else {
                        error('GIT_REPO parameter is required')
                    }
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'npm ci || npm install'
                    } else {
                        bat 'npm ci || npm install'
                    }
                }
            }
        }

        stage('Run Tests') {
            when {
                expression { params.ACTION == 'test' }
            }
            steps {
                script {
                    try {
                        if (isUnix()) {
                            sh 'npm test'
                        } else {
                            bat 'npm test'
                        }
                    } catch (err) {
                        echo 'Tests failed!'
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }

        stage('Build') {
            when {
                expression { params.ACTION == 'deploy' }
            }
            steps {
                script {
                    // Node projects might have a build step (TypeScript, etc.)
                    // Use try-catch to ignore if 'build' script doesn't exist
                    try {
                        if (isUnix()) {
                            sh 'npm run build'
                        } else {
                            bat 'npm run build'
                        }
                    } catch (err) {
                        echo "Skip build: No 'build' script or build failed."
                    }
                }
            }
        }

        stage('Deploy') {
             when {
                expression { params.ACTION == 'deploy' }
            }
            steps {
                script {
                    echo "Deploying Node App to \${params.ENV}..."
                    def targetPath = params.OUTPUT_PATH

                    if (isUnix()) {
                        sh "mkdir -p \${targetPath}"
                        // Copy all files except node_modules, .git and .env
                        sh "rsync -av --exclude 'node_modules' --exclude '.git' --exclude '.env' ./ \${targetPath}"
                    } else {
                        bat """
                            if not exist "\${targetPath}" mkdir "\${targetPath}"
                            robocopy . "\${targetPath}" /E /XD node_modules .git /XF .env /NJH /NJS /MT /R:3 /W:5 || (if %ERRORLEVEL% LEQ 8 exit 0 else exit %ERRORLEVEL%)
                        """
                    }
                    echo "Application files successfully deployed to \${targetPath}"
                }
            }
        }
    }
}
`;


module.exports = {
    getReactPipeline,
    getNodePipeline
};
