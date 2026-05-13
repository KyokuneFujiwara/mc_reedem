export default {
  async fetch(request) {
    return new Response("边缘函数运行正常！", {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
};