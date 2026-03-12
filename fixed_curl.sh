curl -X 'POST' \
  'http://localhost:5000/api/superadmin/admins' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJzdXBlcmFkbWluQHRlc3QuY29tIiwicm9sZSI6IlNVUEVSQURNSU4iLCJ1c2VyVHlwZSI6ImFkbWluIiwiaWF0IjoxNzczMjk5NTExLCJleHAiOjE3NzM5MDQzMTF9.SpUndQUuzrRgeVgmOOzJrFVO4ZGCOqSbPE-ks2eaQKk' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "admin",
  "email": "admin@test.com",
  "username": "admin_user",
  "password": "password123",
  "role": "TEACHER",
  "batch_id": 3
}'
