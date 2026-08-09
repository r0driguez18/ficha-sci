import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Gerar JWT Secret (256 bits = 32 bytes)
const jwtSecret = crypto.randomBytes(32).toString('base64');

console.log('=== CHAVES GERADAS ===\n');
console.log('JWT_SECRET:');
console.log(jwtSecret);
console.log('\n---\n');

// Gerar ANON_KEY
const anonPayload = {
  role: 'anon',
  iss: 'supabase',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) // 10 anos
};

const anonKey = jwt.sign(anonPayload, jwtSecret);

console.log('ANON_KEY:');
console.log(anonKey);
console.log('\n---\n');

// Gerar SERVICE_ROLE_KEY
const servicePayload = {
  role: 'service_role',
  iss: 'supabase',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) // 10 anos
};

const serviceKey = jwt.sign(servicePayload, jwtSecret);

console.log('SERVICE_ROLE_KEY:');
console.log(serviceKey);
console.log('\n=== FIM ===');