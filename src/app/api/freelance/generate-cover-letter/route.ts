import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, skills, clientName, platform, tone, wordLimit } = body;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const toneStr = tone || "professional";
    const limit = wordLimit || 200;
    const skillStr = Array.isArray(skills) ? skills.join(", ") : skills || "";
    const clientStr = clientName || "cliente";

    const template = generateCoverLetter(title, description || "", skillStr, clientStr, platform || "plataforma", toneStr, limit);

    return NextResponse.json({ coverLetter: template });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function generateCoverLetter(
  title: string,
  description: string,
  skills: string,
  clientName: string,
  platform: string,
  tone: string,
  wordLimit: number
): string {
  const descBrief = description.length > 300 ? description.substring(0, 300) + "..." : description;

  const letters = [
    `Olá! Li com atenção o projeto "${title}" e acredito ser um fit excelente para minhas habilidades.

${skills ? `Tenho experiência sólida em ${skills}, que são exatamente as tecnologias que você está buscando.` : "Minhas habilidades técnicas se alinham bem com os requisitos do projeto."}

${descBrief ? `Analisando a descrição: ${descBrief}` : ""}

Gostaria de entender melhor como você vê a divisão de escopo e prazos para este projeto. Tem algum milestone específico em mente?

Aguardo seu retorno para discutirmos os detalhes.`,

    `Sobre o projeto "${title}":

${skills ? `Minha stack principal inclui ${skills}, o que me permite entregar resultados de alta qualidade para este tipo de projeto.` : "Tenho a experiência necessária para este projeto."}

${descBrief ? `Entendi que o projeto envolve: ${descBrief}` : ""}

Alguns diferenciais que trago:
- Experiência em projetos similares com entregas no prazo
- Comunicação clara e transparente durante todo o desenvolvimento
- Disponibilidade para alinhamentos frequentes

Você teria disponibilidade para uma call rápida para alinharmos os detalhes técnicos?`,

    `Olá! Me interessei pelo projeto "${title}".

${skills ? `Trabalho com ${skills} diariamente e tenho cases de sucesso que demonstram minha capacidade de entregar resultados.` : "Tenho ampla experiência na área e posso contribuir significativamente."}

${descBrief ? `Sobre a descrição: ${descBrief}` : ""}

Gostaria de propor uma abordagem para este projeto. Podemos agendar uma conversa para eu apresentar minhas ideias?

Fico à disposição.`,
  ];

  const idx = tone === "friendly" ? 0 : tone === "technical" ? 1 : tone === "results-oriented" ? 2 : 0;
  return letters[idx];
}
