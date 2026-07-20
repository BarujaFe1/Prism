import { NextResponse } from "next/server";
import { db } from "@/db";
import { profile, jobs, monitoredCompanies, freelanceProjects } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const p = await db.select().from(profile).where(eq(profile.id, "default")).get() || {
      name: "Felipe Alirio Baruja",
      headline: "Estudante de Estatística e Ciência de Dados | USP",
      summary: "",
      skills: [],
      skillsEvidence: [],
    };
    
    const allJobs = await db.select().from(jobs).all();
    
    let companiesCount = 0;
    try {
      const companiesResult = await db.select({ count: sql<number>`count(*)` }).from(monitoredCompanies).get();
      companiesCount = companiesResult?.count || 0;
    } catch {
      // fallback
    }

    let freelanceCount = 0;
    try {
      const freelanceResult = await db.select({ count: sql<number>`count(*)` }).from(freelanceProjects).get();
      freelanceCount = freelanceResult?.count || 0;
    } catch {
      // fallback
    }

    // Process stats
    const totalJobs = allJobs.length;
    const pipelineJobs = allJobs.filter((j) => 
      ["saved", "high_priority", "preparing", "applied", "reviewing", "testing", "interview", "offer", "rejected"].includes(j.status || "")
    );
    const appliedJobs = allJobs.filter((j) => 
      ["applied", "reviewing", "testing", "interview", "offer", "rejected"].includes(j.status || "")
    );
    const offers = allJobs.filter((j) => j.status === "offer").length;
    const interviews = allJobs.filter((j) => ["interview", "offer"].includes(j.status || "")).length;

    // Recurrent Gaps
    const profileSkillsLower = (p.skills || []).map((s: string) => s.toLowerCase());
    const gapMap = new Map<string, number>();
    pipelineJobs.forEach((j) => {
      let missingGaps: string[] = [];
      try {
        const details = typeof j.scoreDetails === "string" ? JSON.parse(j.scoreDetails) : j.scoreDetails;
        missingGaps = details?.missingGaps || [];
      } catch {
        const jTechs = j.technologies || [];
        missingGaps = jTechs.filter((t: string) => !profileSkillsLower.includes(t.toLowerCase()));
      }
      missingGaps.forEach((g) => {
        const capitalizedGap = g.charAt(0).toUpperCase() + g.slice(1).toLowerCase();
        gapMap.set(capitalizedGap, (gapMap.get(capitalizedGap) || 0) + 1);
      });
    });
    const topGaps = [...gapMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    // Evidences
    const evidences = p.skillsEvidence || [];

    // Construct Markdown content
    let md = `# CASE STUDY: Prism — Career Intelligence OS Pessoal\n\n`;
    md += `Gerado automaticamente pelo **Prism** em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}.\n\n`;
    
    md += `## 1. Perfil Profissional\n\n`;
    md += `**Nome:** ${p.name || "Felipe Alirio Baruja"}\n`;
    md += `**Headline:** ${p.headline || ""}\n\n`;
    md += `### Resumo Profissional\n`;
    md += `${p.summary || "Estudante de Estatística e Ciência de Dados na USP/ICMC."}\n\n`;
    
    md += `## 2. Estatísticas de Operação Real do Prism\n\n`;
    md += `| Métrica | Valor Registrado |\n`;
    md += `| :--- | :--- |\n`;
    md += `| **Empresas Monitoradas no Ecossistema** | ${companiesCount} |\n`;
    md += `| **Oportunidades de Vagas Coletadas/Processadas** | ${totalJobs} |\n`;
    md += `| **Oportunidades Salvas/Priorizadas no Pipeline** | ${pipelineJobs.length} |\n`;
    md += `| **Candidaturas Estratégicas Iniciadas/Enviadas** | ${appliedJobs.length} |\n`;
    md += `| **Avanços para Entrevistas** | ${interviews} |\n`;
    md += `| **Propostas de Emprego / Ofertas Recebidas** | ${offers} |\n`;
    md += `| **Projetos Freelance Coletados** | ${freelanceCount} |\n\n`;

    md += `## 3. Matriz de Evidências de Competências (Evidences Matrix)\n\n`;
    md += `O Prism utiliza uma Matriz de Evidências para comprovar as habilidades declaradas no perfil através de projetos reais com impacto mensurável, turbinando a personalização e o scoring.\n\n`;
    
    if (evidences.length === 0) {
      md += `*Nenhuma evidência cadastrada no momento.*\n\n`;
    } else {
      evidences.forEach((ev: any, idx: number) => {
        md += `### Projeto ${idx + 1}: ${ev.projectName}\n\n`;
        if (ev.projectUrl) md += `- **Link:** [Ver Projeto/Código](${ev.projectUrl})\n`;
        md += `- **Nível de Confiança:** \`${ev.confidence?.toUpperCase() || "MED"}\`\n`;
        md += `- **Habilidades Relacionadas:** ${ev.associatedSkills?.join(", ") || ""}\n`;
        if (ev.description) md += `- **Descrição:** ${ev.description}\n`;
        if (ev.metrics) md += `- **Impacto Real / Métrica:** *${ev.metrics}*\n`;
        if (ev.approvedResumeBullet) md += `- **Bullet do Currículo:** \`${ev.approvedResumeBullet}\`\n`;
        md += `\n`;
      });
    }

    md += `## 4. Gaps de Habilidades Mais Recorrentes no Pipeline\n\n`;
    md += `Análise de demanda do mercado a partir das vagas priorizadas por Felipe, indicando o foco ideal do Plano de Estudos (Learning Backlog):\n\n`;
    if (topGaps.length === 0) {
      md += `*Nenhum gap recorrente detectado.*\n\n`;
    } else {
      md += `| Habilidade / Tecnologia | Frequência nas Vagas Prioritárias |\n`;
      md += `| :--- | :--- |\n`;
      topGaps.forEach(([tech, count]) => {
        md += `| **${tech}** | Presente em ${count} vaga(s) salvas |\n`;
      });
      md += `\n`;
    }

    md += `## 5. Arquitetura Técnica & Decisões de Design\n\n`;
    md += `### 5.1 Filosofia Local-First & Single-User\n`;
    md += `- **Framework:** Next.js (App Router) + TypeScript + React Query.\n`;
    md += `- **Banco de Dados:** SQLite local (\`prism.db\`) gerenciado via **Drizzle ORM** para alta performance em leituras rápidas.\n`;
    md += `- **Segurança & Confiança:** Sanitização completa de HTML entities em descrições de vagas externas via parser de cliente com whitelist de tags seguras, impedindo ataques XSS e garantindo layout impecável.\n\n`;
    
    md += `### 5.2 Motor de Fit Score e Actionability\n`;
    md += `Em vez de um job tracker convencional baseado em palavras-chave genéricas, o Prism executa uma priorização multidimensional determinística (sem necessidade de chamadas lentas de IA):\n\n`;
    md += `1. **Fit Técnico (Technical Fit):** Calcula a cobertura de competências (skills core) exigidas contra o perfil de Felipe, pesando tecnologias secundárias e de domínio (peso 25%).\n`;
    md += `2. **Elegibilidade (Reality Check):** Um filtro estrito de senioridade penaliza fortemente cargos seniores, de liderança (como "Senior", "Lead", "Staff", "Founding Engineer") ou de trilhas incompatíveis (WordPress, Design puro) para um desenvolvedor/analista em estágio ou júnior (peso 25%).\n`;
    md += `3. **Actionability Score:** Determina o nível de prioridade da ação (APPLY_NOW, PREPARE_FIRST, WATCH, LEARN_FIRST, SUPPRESSED) combinando:\n`;
    md += `   - Domínio da vaga (vagas de dados sobem; web genérica/mobile descem) (20%);\n`;
    md += `   - Evidências associadas aos requisitos no perfil (15%);\n`;
    md += `   - Modalidade de trabalho (remota/híbrida ou presencial em São Carlos-SP pontuam 100%; presencial fora perde pontos) (10%);\n`;
    md += `   - Transparência salarial e reputação da fonte (5%).\n\n`;

    md += `## 6. Resultados Obtidos\n\n`;
    md += `Com o Prism operando como um **Career Intelligence OS**, Felipe Alirio Baruja reduz o ruído de centenas de vagas semanais em portais genéricos para focar apenas nas oportunidades de alto fit. O acompanhamento rigoroso do pipeline Kanban, aliado ao checklist de qualidade de candidatura, maximiza as taxas de conversão de descoberta para entrevistas reais.\n`;

    return new Response(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'attachment; filename="prism-case-study.md"',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
