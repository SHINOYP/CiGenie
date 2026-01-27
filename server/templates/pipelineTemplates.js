const getReactPipeline = () => `
pipeline {
    agent any

    tools {
        nodejs 'NodeJS'
    }

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
                sh 'npm ci'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying React App...'
            }
        }
    }
}
`;


const getNodePipeline = () => `
pipeline {
    agent any

    tools {
        nodejs 'NodeJS'
    }

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
                sh 'npm ci'
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
