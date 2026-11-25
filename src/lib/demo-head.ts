export function demoHead(name: string, description: string) {
  const title = name + " · RAG Engineering Lab";
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  };
}
