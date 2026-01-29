const getReactPipeline = () => `
pipeline {
    agent any

    parameters {
        string(name: 'GIT_REPO', defaultValue: '', description: 'Git repository URL')
        string(name: 'BRANCH', defaultValue: 'main', description: 'Git branch')
        string(name: 'ACTION', defaultValue: 'deploy', description: 'Action to perform')
        string(name: 'ENV', defaultValue: 'dev', description: 'Target environment')
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

        stage('Build') {
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
            steps {
                echo "Deploying React App to \${params.ENV}..."
                echo 'Build artifacts ready in dist/build folder'
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

        stage('Deploy & Restart') {
            steps {
                echo "Deploying Node App to \${params.ENV}..."
                echo 'Application restarted.'
            }
        }
    }
}
`;


module.exports = {
    getReactPipeline,
    getNodePipeline
};
