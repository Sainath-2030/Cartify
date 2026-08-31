async function testHttp() {
  const rawUrl = 'https://m.media-amazon.com/images/W/IMAGERENDERING_521856-T2/images/I/91An8OtMBPL._AC_UL320_.jpg';
  const fixedUrl = 'https://m.media-amazon.com/images/I/91An8OtMBPL._AC_UL320_.jpg';

  const r1 = await fetch(rawUrl);
  console.log('Raw URL Status:', r1.status, 'Content-Length:', r1.headers.get('content-length'));

  const r2 = await fetch(fixedUrl);
  console.log('Fixed URL Status:', r2.status, 'Content-Length:', r2.headers.get('content-length'));
}

testHttp().catch(console.error);
