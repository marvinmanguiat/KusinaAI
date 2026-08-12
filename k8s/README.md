# Kubernetes deployment for menu microservice

1. Build the jar:
   - .\mvnw.cmd -f menu-service/pom.xml clean package -DskipTests
2. Build the image:
   - docker build -t menu-service:latest -f menu-service/Dockerfile menu-service
3. Apply the manifests:
   - kubectl apply -f k8s/menu-service.yaml
4. Verify:
   - kubectl get pods -l app=menu-service
   - kubectl get svc menu-service
   - kubectl port-forward svc/menu-service 8081:80
