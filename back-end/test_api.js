async function test() {
  try {
    const r = await fetch('http://localhost:5000/api/users/register-details/rahul@gmail.com');
    const d = await r.json();
    console.log('API RESPONSE COLLEGE:', JSON.stringify(d.college));
  } catch (e) {
    console.error('FETCH ERROR:', e);
  }
}
test();
