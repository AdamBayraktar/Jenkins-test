pipeline {
    agent any
    stages {
        stage('Install dependencies') {
            steps {
                sh '''
                node -v
                npm -v
                npm i
                '''
            }
        }

        stage('test') {
            steps{
                sh 'npm test'
            }
        }
    }
}
