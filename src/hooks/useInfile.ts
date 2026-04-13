"use client";

import { useState, useCallback } from "react";
import type { DTEInput, AnulacionDTEInput, INFILEResponse } from "@/types/infile";

// ─── Hook: Certificar DTE ─────────────────────────────────────────────────────

export function useCertificar() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [respuesta, setRespuesta] = useState<INFILEResponse | null>(null);

  async function certificar(input: DTEInput): Promise<INFILEResponse | null> {
    setLoading(true);
    setError(null);
    setRespuesta(null);

    try {
      const res = await fetch("/api/infile/certificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = (await res.json()) as INFILEResponse & { error?: string };

      if (!res.ok || data.error) {
        const msg = data.error ?? "Error al certificar el documento.";
        setError(msg);
        return null;
      }

      setRespuesta(data);
      return data;
    } catch {
      const msg = "Error de conexión con el servidor.";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }

  const reset = useCallback(() => {
    setError(null);
    setRespuesta(null);
  }, []);

  return { certificar, loading, error, respuesta, reset };
}

// ─── Hook: Anular DTE ─────────────────────────────────────────────────────────

export function useAnular() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [respuesta, setRespuesta] = useState<INFILEResponse | null>(null);

  async function anular(input: AnulacionDTEInput): Promise<INFILEResponse | null> {
    setLoading(true);
    setError(null);
    setRespuesta(null);

    try {
      const res = await fetch("/api/infile/anular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = (await res.json()) as INFILEResponse & { error?: string };

      if (!res.ok || data.error) {
        const msg = data.error ?? "Error al anular el documento.";
        setError(msg);
        return null;
      }

      setRespuesta(data);
      return data;
    } catch {
      const msg = "Error de conexión con el servidor.";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }

  const reset = useCallback(() => {
    setError(null);
    setRespuesta(null);
  }, []);

  return { anular, loading, error, respuesta, reset };
}
