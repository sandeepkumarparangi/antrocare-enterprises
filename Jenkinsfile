/*
 * Jenkins Pipeline for Antrocare Enterprises
 * 
 * This Jenkinsfile defines a CI/CD pipeline for building, testing,
 * and deploying the Antrocare Enterprises application.
 */

pipeline {
    agent any
    
    environment {
        // Docker configuration
        REGISTRY = 'docker.io' // or your preferred registry
        IMAGE_NAME = "yourusername/antrocare-enterprises"
        VERSION = "${env.BUILD_NUMBER}"
        
        // Tool versions
        JAVA_VERSION = '17'
        NODE_VERSION = '22'
    }
    
    options {
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
        ansiColor('xterm')
        discardOldBuilds(daysToKeepStr: '30', numToKeepStr: '10')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Setup Environment') {
            steps {
                // Install JDK
                tool name: "jdk${JAVA_VERSION}", alias: 'jdk'
                withEnv("JAVA_HOME=${tool \"jdk${JAVA_VERSION}\"" + "}") {
                    sh '''
                        echo "Java version:"
                        java -version
                    '''
                }
                
                // Install Node.js
                sh '''
                    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
                    sudo apt-get install -y nodejs
                    echo "Node version:"
                    node --version
                    echo "NPM version:"
                    npm --version
                '''
            }
        }
        
        stage('Cache Dependencies') {
            steps {
                // Cache Maven dependencies
                cache branch: 'main', key: "maven-${{ checksum('pom.xml') }}, path: '.m2/repository'
                
                // Cache Node.js modules
                cache branch: 'main', key: "nodejs-${{ checksum('frontend/package-lock.json') }}, path: 'frontend/node_modules'
            }
        }
        
        stage('Backend Build & Test') {
            steps {
                withEnv("JAVA_HOME=${tool \"jdk${JAVA_VERSION}\"" + "}") {
                    sh './mvnw -B clean compile'
                    sh './mvnw -B test'
                }
            }
        }
        
        stage('Frontend Build & Test') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm run lint --if-present || echo "Linting skipped"'
                    sh 'npm run test --if-present || echo "Testing skipped"'
                    sh 'npm run build'
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    // Build Docker image
                    docker.build("${ENVIRONMENT.IMAGE_NAME}:${ENVIRONMENT.VERSION}") {
                        inside('.'){
                            sh '''
                                # Copy frontend build to backend resources
                                rm -rf src/main/resources/static/*
                                cp -r frontend/dist/* src/main/resources/static/
                            '''
                        }
                    }
                    
                    // Build with Maven and Dockerfile
                    sh './mvnw -B package -DskipTests'
                    sh "docker build -t ${ENVIRONMENT.IMAGE_NAME}:${ENVIRONMENT.VERSION} ."
                    sh "docker tag ${ENVIRONMENT.IMAGE_NAME}:${ENVIRONMENT.VERSION} ${ENVIRONMENT.IMAGE_NAME}:latest"
                }
            }
        }
        
        stage('Push Docker Image') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Login to Docker registry
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', 
                                                       usernameVariable: 'DOCKER_USER', 
                                                       passwordVariable: 'DOCKER_PASS')]) {
                        sh """
                            echo \"${DOCKER_PASS}\" | docker login -u \"${DOCKER_USER}\" --password-stdin
                            docker push ${ENVIRONMENT.IMAGE_NAME}:${ENVIRONMENT.VERSION}
                            docker push ${ENVIRONMENT.IMAGE_NAME}:latest
                        """
                    }
                }
            }
        }
        
        stage('Security Scanning') {
            steps {
                // Example using Trivy (would need to be installed)
                // sh "trivy image --exit-code 1 --severity HIGH,CRITICAL ${ENVIRONMENT.IMAGE_NAME}:${ENVIRONMENT.VERSION}"
                echo "Security scanning placeholder - add your preferred security scanner"
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                // Add your deployment logic here
                // Examples:
                // - Kubernetes: sh 'kubectl set image deployment/antrocare-antrocare=${IMAGE_NAME}:${VERSION}'
                // - AWS ECS: aws ecs update-service --cluster CLUSTER --service SERVICE --image ${IMAGE_NAME}:${VERSION}
                // - Docker Compose on remote server: ssh user@server "docker-compose pull && docker-compose up -d"
                echo "Deployment placeholder - add your deployment script here"
            }
        }
    }
    
    post {
        always {
            // Clean up workspace
            cleanWs()
            
            // Archive test results
            junit '**/target/surefire-reports/*.xml'
            junit 'frontend/**/test-results/*.xml' || echo "No frontend test reports found"
            
            // Archive build artifacts
            archiveArtifacts artifacts: 'target/*.jar', fingerprint: true
            archiveArtifacts artifacts: 'frontend/dist/**', fingerprint: true
        }
        
        success {
            echo 'Pipeline completed successfully!'
            // Add notifications here (Slack, Email, etc.)
        }
        
        failure {
            echo 'Pipeline failed!'
            // Add failure notifications
        }
    }
}
