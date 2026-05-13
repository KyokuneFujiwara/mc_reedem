// EdgeOne 边缘函数入口
const ADMIN_PASSWORD = 'cdd345cdd'; // 可自行修改

// 用户抽码页面 HTML
const htmlPage = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>领取激活码</title>
<style>
  body { font-family: Arial, sans-serif; text-align: center; margin: 0; background: linear-gradient(to bottom, #FFE4B5, #ffffff); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
  .container { max-width: 400px; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin: 20px; }
  button { padding: 15px 40px; font-size: 20px; background: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer; margin: 15px 0; }
  button:disabled { background: #ccc; cursor: not-allowed; }
  #codeBox { min-height: 40px; font-size: 28px; letter-spacing: 3px; font-weight: bold; color: #e67e22; margin: 20px 0; word-break: break-all; }
  .info { color: #888; font-size: 14px; margin-top: 10px; }
</style>
</head>
<body>
<div class="container">
  <h2>🎁 领取您的激活码</h2>
  <p>点击下方按钮，随机获取一个专属激活码</p>
  <button id="drawBtn" onclick="drawCode()">抽取激活码</button>
  <div id="codeBox"></div>
  <p id="msg" style="color: red;"></p>
  <hr>
  <p class="info">获得激活码后，请进入游戏内输入 <code>/redeem 激活码</code> 兑换打单机</p>
  <p class="info">每人限领一次，请勿重复抽取</p>
</div>
<script>
async function drawCode() {
  const btn = document.getElementById('drawBtn');
  const codeBox = document.getElementById('codeBox');
  const msg = document.getElementById('msg');
  btn.disabled = true;
  btn.textContent = '抽取中...';
  msg.textContent = '';
  try {
    let resp = await fetch('/draw', { method: 'POST' });
    let data = await resp.json();
    if (data.success) {
      codeBox.textContent = data.code;
      btn.textContent = '已领取';
    } else {
      msg.textContent = data.msg || '抽取失败';
      btn.textContent = '重新抽取';
      btn.disabled = false;
    }
  } catch(e) {
    msg.textContent = '网络错误，请重试';
    btn.textContent = '重新抽取';
    btn.disabled = false;
  }
}
</script>
</body>
</html>`;

// 管理页面 HTML
const adminPage = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>激活码管理</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 600px; margin: 30px auto; background: linear-gradient(to bottom, #FFE4B5, #ffffff); min-height: 100vh; padding: 20px; }
  label, input, textarea { display: block; margin: 10px 0; }
  input { padding: 8px; width: 300px; }
  button { padding: 8px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; }
  #list { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 20px; }
  .code { display: inline-block; background: #eee; padding: 4px 10px; margin: 4px; border-radius: 4px; font-family: monospace; }
</style>
</head>
<body>
<h2>🛠️ 激活码管理面板</h2>
<div>
  <label>单个添加激活码（例如 ABCD-1234-EFGH）</label>
  <input type="text" id="singleCode" placeholder="输入激活码">
  <button onclick="addCode()">添加</button>
</div>
<div style="margin-top: 20px;">
  <label>批量添加（每行一个，或逗号分隔）</label>
  <textarea id="batchCodes" rows="5" placeholder="粘贴多个激活码，每行一个或用逗号隔开"></textarea>
  <button onclick="batchAdd()">批量添加</button>
</div>
<hr>
<div>
  <button onclick="listCodes()">刷新库存列表</button>
  <button style="background: #e74c3c;" onclick="clearAll()">清空所有激活码</button>
  <span id="count" style="margin-left: 20px; font-weight: bold;"></span>
</div>
<div id="list"></div>
<script>
const PWD = '${ADMIN_PASSWORD}';

async function addCode() {
  let code = document.getElementById('singleCode').value.trim();
  if(!code) return alert('请输入激活码');
  let resp = await fetch('/add?pwd='+PWD+'&code='+encodeURIComponent(code));
  if(resp.ok) {
    alert(await resp.text());
    document.getElementById('singleCode').value = '';
    listCodes();
  } else {
    alert('添加失败');
  }
}

async function batchAdd() {
  let raw = document.getElementById('batchCodes').value;
  let codes = raw.split(/[\\n,]+/).map(c => c.trim()).filter(c => c.length > 0);
  if(codes.length === 0) return alert('请粘贴激活码');
  for(let code of codes) {
    await fetch('/add?pwd='+PWD+'&code='+encodeURIComponent(code));
  }
  alert('批量添加完成');
  document.getElementById('batchCodes').value = '';
  listCodes();
}

async function listCodes() {
  let resp = await fetch('/list?pwd='+PWD);
  let data = await resp.json();
  document.getElementById('count').textContent = '剩余 ' + data.count + ' 个';
  let listDiv = document.getElementById('list');
  listDiv.innerHTML = data.codes.map(c => '<span class="code">' + c + '</span>').join('');
}

async function clearAll() {
  if(!confirm('确定要清空所有激活码？')) return;
  await fetch('/clear?pwd='+PWD);
  alert('已清空');
  listCodes();
}

listCodes();
</script>
</body>
</html>`;

// 登录页面
function getLoginPage(errorMsg = '') {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>管理员登录</title>
<style>
  body { font-family: Arial, sans-serif; margin: 0; min-height: 100vh; background: linear-gradient(to bottom, #FFE4B5, #ffffff); display: flex; align-items: center; justify-content: center; }
  .login-box { background: white; padding: 35px 30px; border-radius: 15px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); text-align: center; width: 320px; }
  h2 { margin-top: 0; color: #333; }
  input[type="password"] { width: 100%; padding: 12px; margin: 15px 0; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; box-sizing: border-box; }
  button { width: 100%; padding: 12px; background: #4CAF50; color: white; border: none; border-radius: 6px; font-size: 18px; cursor: pointer; }
  .error { color: #e74c3c; margin-bottom: 10px; font-size: 14px; }
</style>
</head>
<body>
<div class="login-box">
  <h2>🔐 管理员登录</h2>
  ${errorMsg ? '<p class="error">'+errorMsg+'</p>' : ''}
  <form method="POST" action="/admin">
    <input type="password" name="password" placeholder="请输入管理密码" autofocus required>
    <button type="submit">登 录</button>
  </form>
</div>
</body>
</html>`;
}

// 主处理函数
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 首页
    if (path === '/' || path === '/index.html') {
      return new Response(htmlPage, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // 管理页面（登录）
    if (path === '/admin') {
      if (request.method === 'POST') {
        const formData = await request.formData();
        const pwd = formData.get('password') || '';
        if (pwd === ADMIN_PASSWORD) {
          return new Response(null, {
            status: 302,
            headers: {
              'Location': '/admin',
              'Set-Cookie': 'auth=1; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=86400'
            }
          });
        } else {
          return new Response(getLoginPage('密码错误，请重试'), {
            status: 401,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }
      }

      // GET 请求，检查 Cookie
      const cookie = request.headers.get('Cookie') || '';
      if (cookie.includes('auth=1')) {
        return new Response(adminPage, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      } else {
        return new Response(getLoginPage(), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
    }

    // API：抽取激活码
    if (path === '/draw' && request.method === 'POST') {
      try {
        // 从 KV 中读取未使用码列表
        const unusedStr = await env.REDEEM_KV.get('unused_codes');
        const codes = unusedStr ? JSON.parse(unusedStr) : [];
        if (codes.length === 0) {
          return new Response(JSON.stringify({ success: false, msg: '激活码已被领完' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        const randomIdx = Math.floor(Math.random() * codes.length);
        const code = codes[randomIdx];
        codes.splice(randomIdx, 1); // 移除
        // 存回
        await env.REDEEM_KV.put('unused_codes', JSON.stringify(codes));
        // 记录已使用（可选）
        const usedStr = await env.REDEEM_KV.get('used_codes');
        const used = usedStr ? JSON.parse(usedStr) : [];
        used.push(code);
        await env.REDEEM_KV.put('used_codes', JSON.stringify(used));
        return new Response(JSON.stringify({ success: true, code }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, msg: '服务器错误' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // API：添加激活码
    if (path === '/add') {
      const pwd = url.searchParams.get('pwd') || '';
      if (pwd !== ADMIN_PASSWORD) return new Response('Unauthorized', { status: 401 });
      const code = url.searchParams.get('code');
      if (!code || code.trim() === '') return new Response('需要 ?code=XXXX', { status: 400 });
      const cleanCode = code.toUpperCase().trim();
      const unusedStr = await env.REDEEM_KV.get('unused_codes');
      const codes = unusedStr ? JSON.parse(unusedStr) : [];
      if (!codes.includes(cleanCode)) {
        codes.push(cleanCode);
        await env.REDEEM_KV.put('unused_codes', JSON.stringify(codes));
      }
      return new Response(`已添加：${cleanCode}`, { status: 200 });
    }

    // API：查看库存
    if (path === '/list') {
      const pwd = url.searchParams.get('pwd') || '';
      if (pwd !== ADMIN_PASSWORD) return new Response('Unauthorized', { status: 401 });
      const unusedStr = await env.REDEEM_KV.get('unused_codes');
      const codes = unusedStr ? JSON.parse(unusedStr) : [];
      return new Response(JSON.stringify({ count: codes.length, codes }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // API：清空
    if (path === '/clear') {
      const pwd = url.searchParams.get('pwd') || '';
      if (pwd !== ADMIN_PASSWORD) return new Response('Unauthorized', { status: 401 });
      await env.REDEEM_KV.put('unused_codes', '[]');
      await env.REDEEM_KV.put('used_codes', '[]');
      return new Response('已清空所有激活码', { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
  }
};