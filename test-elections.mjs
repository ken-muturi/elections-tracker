import http from 'http';

function httpGet(url, cookies = []) {
  return new Promise((resolve, reject) => {
    const opts = { headers: {} };
    if (cookies.length) opts.headers['Cookie'] = cookies.join('; ');
    http.get(url, opts, (res) => {
      let data = '';
      const resCookies = res.headers['set-cookie'] || [];
      res.on('data', c => data += c);
      res.on('end', () => resolve({ data, cookies: resCookies, status: res.statusCode, headers: res.headers }));
    }).on('error', reject);
  });
}

function httpPost(url, body, cookies) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams(body).toString();
    const urlObj = new URL(url);
    const opts = {
      hostname: urlObj.hostname, port: urlObj.port, path: urlObj.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData), 'Cookie': cookies.join('; ') }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      const resCookies = res.headers['set-cookie'] || [];
      res.on('data', c => data += c);
      res.on('end', () => resolve({ data, cookies: resCookies, status: res.statusCode, headers: res.headers }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  const BASE = 'http://localhost:3008';
  
  // 1) Get CSRF token
  const csrf = await httpGet(`${BASE}/api/auth/csrf`);
  console.log('CSRF status:', csrf.status);
  const csrfToken = JSON.parse(csrf.data).csrfToken;
  
  // 2) Login
  const login = await httpPost(`${BASE}/api/auth/callback/credentials`, {
    csrfToken,
    email: 'admin@election.ke',
    password: 'Admin@123',
    callbackUrl: `${BASE}/elections`,
    json: 'true'
  }, csrf.cookies.map(c => c.split(';')[0]));
  console.log('Login status:', login.status);
  
  // 3) Collect all session cookies
  const allCookies = [...csrf.cookies, ...login.cookies].map(c => c.split(';')[0]);
  console.log('Cookies:', allCookies);
  
  // 4) Verify session
  const session = await httpGet(`${BASE}/api/auth/session`, allCookies);
  console.log('Session status:', session.status, 'body:', session.data.substring(0, 200));
  
  // 5) Access /elections
  const elections = await httpGet(`${BASE}/elections`, allCookies);
  console.log('Elections status:', elections.status);
  if (elections.status >= 400) {
    console.log('Error body:', elections.data.substring(0, 500));
  } else if (elections.status >= 300) {
    console.log('Redirect to:', elections.headers.location);
  } else {
    console.log('Success! Body length:', elections.data.length);
  }
}

main().catch(e => console.error(e));
