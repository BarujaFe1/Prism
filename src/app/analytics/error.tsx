"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Analytics Error Boundary caught:", error);
    }
  }, [error]);

  return (
    <div className="px-6 pt-24 pb-16 max-w-xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Card className="border-red-500/20 bg-red-500/5 w-full">
        <CardContent className="pt-6 pb-6 flex flex-col items-center">
          <div className="p-3 bg-red-500/10 rounded-full text-red-500 mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-2">
            Não foi possível carregar o Analytics
          </h2>
          <p className="text-xs text-text-secondary max-w-sm mb-6 leading-relaxed">
            Seus dados continuam totalmente preservados localmente. Ocorreu um erro ao renderizar os gráficos ou processar as métricas de conversão.
          </p>
          <div className="flex gap-3 w-full justify-center">
            <Button
              onClick={() => reset()}
              variant="primary"
              className="gap-2 text-xs"
            >
              <RotateCcw className="h-4 w-4" />
              Tentar novamente
            </Button>
            <Link href="/" passHref legacyBehavior>
              <Button variant="secondary" className="gap-2 text-xs">
                <Home className="h-4 w-4" />
                Voltar para o Radar
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
