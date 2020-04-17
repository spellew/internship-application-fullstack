
addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});


class TextHandler {
  constructor(renderedText) {
    this.renderedText = renderedText;
  }

  element(element) {
    if (this.renderedText) element.setInnerContent(this.renderedText);
  }
}

class AnchorHandler extends TextHandler {
  constructor(renderedText, url) {
    super(renderedText)
    this.url = url;
  }

  element(element) {
    if (this.renderedText) element.setInnerContent(this.renderedText);
    if (this.url) element.setAttribute("href", this.url);

  }
}

class CookiesHandler {
  constructor(data) {
    this.data = data;
  }

  element(element) {
    if (this.data) {
      element.after(`<script>
        if (!document.cookie) {
          alert("Storing variant in cookie!");
          document.cookie = "${this.data}";
        }
      </script>`, { html: true });
    }
  }
}


/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {

  const response = await fetch("https://cfw-takehome.developers.workers.dev/api/variants");
  const obj = await response.json();

  const rand = Math.floor(Math.random() * 2);
  const cookie = request.headers.get("cookie");

  let variant = obj["variants"][rand];
  let source = "random";
  if (cookie) {
    variant = cookie;
    source = "stored";
  }

  if (!variant) return new Response(`Something went very wrong! (rand = ${rand})`, {
    status: 500,
  });
  
  const rewriter = new HTMLRewriter()
    .on("link", new CookiesHandler(variant))
    .on("title", new TextHandler("Shamroy's Cloudflare Challenge"))
    .on("h1#title", new TextHandler("Shamroy's Cloudflare Challenge"))
    .on("p#description", new TextHandler(`Hello World! The ${source} URL was ${variant}. Be sure to delete cookies!`))
    .on("a#url", new AnchorHandler("My Personal Website", "https://shamroy.me"));

  const html = await fetch(variant);
  return rewriter.transform(html);
}
