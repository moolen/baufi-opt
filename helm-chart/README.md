# Baufinanzierungs-Optimierer Helm Chart

Helm chart for deploying the Baufinanzierungs-Optimierer (Mortgage Optimizer) application on Kubernetes.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- Ingress Controller (nginx recommended)
- cert-manager (for automatic TLS with Let's Encrypt)

## Installation

### 1. Update the values

Edit `values.yaml` to configure:

```yaml
# Image configuration
image:
  repository: yourusername/baufi-optimierer  # Your GitHub Container Registry image
  tag: latest

# Domain name for your application
ingress:
  hosts:
    - host: mortgage-optimizer.example.com
      paths:
        - path: /
          pathType: Prefix

# Backend API configuration
backend:
  apiPath: /api  # Path used to reverse proxy to backend
  # apiUrl: "https://api.example.com"  # Uncomment for external backend
```

### 2. Install the chart

```bash
helm install baufi helm-chart/

# Or with custom values
helm install baufi helm-chart/ \
  --set image.tag=v1.0.0 \
  --set ingress.hosts[0].host=my-app.example.com
```

### 3. Verify deployment

```bash
kubectl get deployment
kubectl get ingress
kubectl get pvc  # Check SQLite storage
```

## Configuration

### Common Helm Values

```bash
# Change replica count
helm install baufi helm-chart/ --set replicaCount=3

# Set resource limits
helm install baufi helm-chart/ \
  --set resources.limits.cpu=1 \
  --set resources.limits.memory=512Mi

# Change storage class
helm install baufi helm-chart/ --set persistence.storageClass=fast-ssd

# Disable persistence (not recommended for production)
helm install baufi helm-chart/ --set persistence.enabled=false

# Enable auto-scaling
helm install baufi helm-chart/ \
  --set autoscaling.enabled=true \
  --set autoscaling.minReplicas=2 \
  --set autoscaling.maxReplicas=5
```

### Backend Configuration

If your backend is running in the same cluster:

```bash
helm install baufi helm-chart/ \
  --set backend.apiUrl="http://backend-service.default.svc.cluster.local:3000"
```

If using relative path (local reverse proxy):

```bash
helm install baufi helm-chart/ \
  --set backend.apiPath=/api
```

## Upgrade

```bash
helm upgrade baufi helm-chart/ --set image.tag=v1.1.0
```

## Uninstall

```bash
helm uninstall baufi
```

This will remove all resources except the PersistentVolumeClaim (unless you delete it separately).

## Storage

The SQLite database is persisted in a PersistentVolumeClaim. To check:

```bash
kubectl get pvc
kubectl describe pvc baufi-optimierer
```

To delete the PVC and its data:

```bash
kubectl delete pvc baufi-optimierer
```

## Ingress & TLS

The chart uses cert-manager for automatic TLS certificate provisioning. Ensure:

1. cert-manager is installed in your cluster
2. A ClusterIssuer named `letsencrypt-prod` exists

Create the ClusterIssuer if needed:

```yaml
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
```

## Troubleshooting

### Check pod logs
```bash
kubectl logs -l app.kubernetes.io/name=baufi-optimierer
```

### Check ingress status
```bash
kubectl get ingress
kubectl describe ingress baufi-optimierer
```

### Port forward for debugging
```bash
kubectl port-forward svc/baufi-optimierer 8080:80
# Visit http://localhost:8080
```

### Restart deployment
```bash
kubectl rollout restart deployment/baufi-optimierer
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│          Ingress (cert-manager TLS)             │
│          mortgage-optimizer.example.com         │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  Service (ClusterIP, port 80)                   │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  Deployment (1 replica)                         │
│  ┌─────────────────────────────────────────┐   │
│  │  Nginx Container                         │   │
│  │  - Serves React static assets            │   │
│  │  - Proxies /api/* to backend             │   │
│  │  - Port 8080                             │   │
│  │  Volume: /app/data (SQLite database)     │   │
│  └─────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  PersistentVolumeClaim (1Gi)                    │
│  └─ SQLite Database (/app/data)                │
└─────────────────────────────────────────────────┘
```

## Notes

- The application uses an **nginx** container that serves the React static files and proxies API requests
- **SQLite database** is persisted to a PVC at `/app/data`
- **Security context** is configured with non-root user (UID 1000)
- **Health checks** include liveness and readiness probes
- The Dockerfile for this application should build the React app and serve it via nginx

## License

See the main project repository for license information.
