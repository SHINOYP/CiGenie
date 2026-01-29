const getReactPipeline = () => `
pipeline {
    agent any

    parameters {
        string(name: 'GIT_REPO', description: 'Git repository URL')
        string(name: 'BRANCH', defaultValue: 'main', description: 'Git branch')
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: params.BRANCH, url: params.GIT_REPO
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
                echo 'Deploying React App...'
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
        string(name: 'GIT_REPO', description: 'Git repository URL')
        string(name: 'BRANCH', defaultValue: 'main', description: 'Git branch')
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: params.BRANCH, url: params.GIT_REPO
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
                echo 'Deploying Node App...'
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
