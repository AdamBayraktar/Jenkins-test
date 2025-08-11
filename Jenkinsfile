pipeline {
    agent any
    stages {
        stage('Install dependencies') {
            steps {
                shh '''
                node -v
                npm -v
                npm i
                '''
            }
        }
    }
}
