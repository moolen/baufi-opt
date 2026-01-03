# Helm Chart Quick Start

## 1. Prerequisites Setup

Before deploying, ensure your Kubernetes cluster has:

```bash
# Check Kubernetes version
kubectl version --short

# Check Helm is installed
helm version

# Verify Ingress Controller
kubectl get ingressclass

# Verify cert-manager
kubectl get ns | grep cert-manager
kubectl get clusterissuer
```

## 2. Create cert-manager ClusterIssuer (if needed)

```bash
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

## 3. Configure values.yaml

The key values to change:

```yaml
# 1. Set your image repository
image:
  registry: ghcr.io
  repository: yourusername/baufi-optimierer  # ← Change this
  tag: latest

# 2. Set your domain
ingress:
  hosts:
    - host: mortgage-optimizer.example.com  # ← Change this
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: baufi-optimierer-tls
      hosts:
        - mortgage-optimizer.example.com  # ← Change this too

# 3. Backend API URL (if external)
backend:
  apiPath: /api
  # apiUrl: "https://api.example.com"  # ← Uncomment if external
```

## 4. Install the Helm Chart

### Option A: Basic Installation

```bash
helm install baufi ./helm-chart/
```

### Option B: With Custom Domain

```bash
helm install baufi ./helm-chart/ \
  --set ingress.hosts[0].host=my-app.example.com \
  --set ingress.tls[0].hosts[0]=my-app.example.com
```

### Option C: Production Setup (HA)

```bash
helm install baufi ./helm-chart/ \
  --set replicaCount=3 \
  --set autoscaling.enabled=true \
  --set persistence.storageClass=fast-ssd \
  --set resources.limits.cpu=1 \
  --set resources.limits.memory=512Mi
```

## 5. Verify Deployment

```bash
# Check deployment
kubectl get deployment baufi-optimierer

# Check service
kubectl get svc baufi-optimierer

# Check ingress
kubectl get ingress baufi-optimierer

# Check PVC
kubectl get pvc baufi-optimierer

# View pod logs
kubectl logs -l app.kubernetes.io/name=baufi-optimierer
```

## 6. Access Your Application

### Via Ingress (Recommended)
```bash
# Your app is available at:
https://mortgage-optimizer.example.com
```

### Via Port Forward (Development)
```bash
kubectl port-forward svc/baufi-optimierer 8080:80
# Then visit: http://localhost:8080
```

## 7. Useful Commands

```bash
# Watch deployment status
kubectl get deployment -w

# View helm values
helm get values baufi

# Get deployment info
helm status baufi

# Upgrade to new version
helm upgrade baufi ./helm-chart/ --set image.tag=v1.1.0

# Rollback
helm rollback baufi 1

# Delete deployment
helm uninstall baufi
```

## Troubleshooting

### Check if cert-manager issued the certificate
```bash
kubectl get certificate
kubectl describe certificate baufi-optimierer-tls
```

### Check ingress logs
```bash
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
```

### Test connectivity
```bash
kubectl exec -it $(kubectl get pod -l app.kubernetes.io/name=baufi-optimierer -o jsonpath='{.items[0].metadata.name}') -- sh

# Inside the pod:
curl http://localhost:8080/
curl http://localhost:8080/api/health  # Test backend proxy
```

### View events
```bash
kubectl describe ingress baufi-optimierer
kubectl describe svc baufi-optimierer
```

## Docker Image Requirements

Make sure your Dockerfile produces an nginx-based image that:

1. **Serves React static files** from `/usr/share/nginx/html`
2. **Listens on port 8080** (as specified in deployment)
3. **Has proper nginx config** (the chart provides one via ConfigMap)

Example Dockerfile structure:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

## Next Steps

1. **Build and push your image**: `docker build -t ghcr.io/yourusername/baufi-optimierer:latest .`
2. **Configure DNS**: Point your domain to your Ingress Controller's IP/hostname
3. **Deploy**: Run `helm install baufi ./helm-chart/`
4. **Monitor**: Watch logs and ingress status
5. **Scale**: Adjust `replicaCount` or enable `autoscaling`

For more details, see [README.md](./README.md)
