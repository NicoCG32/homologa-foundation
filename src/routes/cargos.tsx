import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";

import {
  ATRIBUTOS_SEMANTICOS,
  CAMPOS_ESTRUCTURALES,
  atributosVacios,
  createCargo,
  deleteCargo,
  importarCargos,
  estructuralesVacios,
  listCargos,
  type AtributosSemanticos,
  type CargoTipo,
  type Estructurales,
} from "@/lib/cargos.functions";
import {
  EMPRESA_CATALOGO,
  EMPRESA_CATALOGO_TIPO,
  aplicarDiccionario,
  descargarPlantilla,
  leerBandas,
  leerCargos,
  leerDiccionario,
  normalizarNombreEmpresa,
  type BandaImport,
  type EntradaDiccionario,
  type ImportCargo,
} from "@/lib/cargos-import";
import { listEmpresas } from "@/lib/empresas.functions";
import { importarDiccionario, listDiccionario } from "@/lib/diccionario.functions";

import { formatSueldo } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cargos")({
  head: () => ({
    meta: [
      { title: "Cargos — Espejo: Homologa" },
      { name: "description", content: "Cargos internos y de referencia con su empresa, descripción y sueldo." },
      { property: "og:title", content: "Cargos — Espejo: Homologa" },
      { property: "og:description", content: "Administra cargos internos y de referencia por empresa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CargosPage,
});

function contarAtributos(raw: unknown) {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return ATRIBUTOS_SEMANTICOS.filter((a) => typeof o[a.clave] === "string" && o[a.clave] !== "")
    .length;
}

function CargosPage() {
  const qc = useQueryClient();
  const listC = useServerFn(listCargos);
  const listE = useServerFn(listEmpresas);
  const create = useServerFn(createCargo);
  const remove = useServerFn(deleteCargo);
  const importar = useServerFn(importarCargos);
  const listD = useServerFn(listDiccionario);
  const importarDicc = useServerFn(importarDiccionario);
  

  const cargos = useQuery({ queryKey: ["cargos"], queryFn: () => listC() });
  const empresas = useQuery({ queryKey: ["empresas"], queryFn: () => listE() });
  const diccionario = useQuery({ queryKey: ["diccionario"], queryFn: () => listD() });

  const [empresaId, setEmpresaId] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [visibles, setVisibles] = useState(12);
  const [revisado, setRevisado] = useState(false);
  const [tipo, setTipo] = useState<CargoTipo>("INTERNO");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [sueldo, setSueldo] = useState("");
  const [atributos, setAtributos] = useState<AtributosSemanticos>(atributosVacios);
  const [estructurales, setEstructurales] = useState<Estructurales>(estructuralesVacios);
  const [error, setError] = useState<string | null>(null);
  const [modoCarga, setModoCarga] = useState<"INTERNO" | "REFERENCIA">("INTERNO");
  const [cargosCarga, setCargosCarga] = useState<ImportCargo[]>([]);
  const [bandasCarga, setBandasCarga] = useState<BandaImport[]>([]);
  const [erroresCarga, setErroresCarga] = useState<string[]>([]);
  const [archivoCargos, setArchivoCargos] = useState("");
  const [archivoBandas, setArchivoBandas] = useState("");
  const [diccionarioArchivo, setDiccionarioArchivo] = useState<EntradaDiccionario[]>([]);
  const [resultadoDicc, setResultadoDicc] = useState<string | null>(null);
  const [detalleFila, setDetalleFila] = useState<string | null>(null);
  const [detalleTarjeta, setDetalleTarjeta] = useState<string | null>(null);

  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  const invalidate = () => qc.invalidateQueries();

  const createMut = useMutation({
    mutationFn: () =>
      create({
        data: {
          empresa_id: empresaId,
          tipo,
          nombre,
          descripcion,
          sueldo,
          atributos_semanticos: atributos,
          estructurales,
        },
      }),
    onSuccess: () => {
      setNombre("");
      setDescripcion("");
      setSueldo("");
      setAtributos(atributosVacios());
      setEstructurales(estructuralesVacios());
      setError(null);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });


  const resueltos = useMemo(
    () => aplicarDiccionario(cargosCarga, diccionario.data ?? []),
    [cargosCarga, diccionario.data],
  );

  const importMut = useMutation({
    mutationFn: () =>
      importar({
        data: {
          empresa_id: modoCarga === "INTERNO" && empresaId ? empresaId : null,
          empresa_defecto: modoCarga === "REFERENCIA" ? { nombre: EMPRESA_CATALOGO, tipo: EMPRESA_CATALOGO_TIPO } : null,
          tipo: modoCarga,
          cargos: resueltos.cargos,
          bandas: modoCarga === "REFERENCIA" ? bandasCarga : [],
        },
      }),
    onSuccess: () => { setCargosCarga([]); setBandasCarga([]); setErroresCarga([]); setArchivoCargos(""); setArchivoBandas(""); setDiccionarioArchivo([]); setRevisado(false); setBusqueda(""); setVisibles(12); setError(null); invalidate(); },
    onError: (e: Error) => setError(e.message),
  });

  const diccMut = useMutation({
    mutationFn: () => importarDicc({ data: { entradas: diccionarioArchivo } }),
    onSuccess: (r) => {
      setResultadoDicc(
        `${r.agregadas} entradas agregadas al diccionario${r.conflictos.length ? `. Revisa: ${r.conflictos.join("; ")}` : "."}`,
      );
      qc.invalidateQueries({ queryKey: ["diccionario"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  async function hojasArchivo(file: File) {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const out = new Map<string, (string | number | boolean | null)[][]>();
    for (const nombreHoja of wb.SheetNames) {
      const sheet = wb.Sheets[nombreHoja];
      if (!sheet) continue;
      out.set(
        nombreHoja,
        XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" }) as (string | number | boolean | null)[][],
      );
    }
    if (!out.size) throw new Error("El archivo no contiene hojas");
    return out;
  }

  async function filasArchivo(file: File) {
    const hojas = await hojasArchivo(file);
    const primera = hojas.values().next().value;
    if (!primera) throw new Error("No se pudo leer la primera hoja");
    return primera;
  }

  async function cargarEstructura(file: File | undefined) {
    if (!file) return;
    try {
      const hojas = await hojasArchivo(file);
      const nombreDatos = [...hojas.keys()].find((n) => n.toLowerCase() !== "diccionario");
      const filas = nombreDatos ? hojas.get(nombreDatos) ?? [] : [];
      const r = leerCargos(filas);
      setCargosCarga(r.cargos);
      setErroresCarga(r.errores);
      setArchivoCargos(file.name);
      const hojaDicc = [...hojas.keys()].find((n) => n.toLowerCase() === "diccionario");
      setDiccionarioArchivo(hojaDicc ? leerDiccionario(hojas.get(hojaDicc) ?? []) : []);
      setResultadoDicc(null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo leer el archivo");
    }
  }

  async function cargarBandas(file: File | undefined) {
    if (!file) return;
    try { setBandasCarga(leerBandas(await filasArchivo(file))); setArchivoBandas(file.name); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo leer el archivo de remuneraciones"); }
  }

  const empresaDestino = (empresas.data ?? []).find((e) => e.id === empresaId) ?? null;

  const tarjetas = useMemo(() => {
    const conocidas = new Map((empresas.data ?? []).map((e) => [normalizarNombreEmpresa(e.nombre), e]));
    const bandasPorCodigo = new Map<string, BandaImport[]>();
    for (const b of bandasCarga) {
      const lista = bandasPorCodigo.get(b.codigo_cargo) ?? [];
      lista.push(b);
      bandasPorCodigo.set(b.codigo_cargo, lista);
    }
    // Identidad de un cargo: tipo + código + empresa.
    const yaCargados = new Set(
      (cargos.data ?? [])
        .filter((c) => c.codigo_cargo)
        .map((c) => `${normalizarNombreEmpresa(c.empresas?.nombre ?? "")}|${c.tipo}|${c.codigo_cargo}`),
    );
    const avisosPorCargo = new Map<string, string[]>();
    for (const a of resueltos.avisos) {
      const lista = avisosPorCargo.get(a.cargo) ?? [];
      lista.push(a.mensaje);
      avisosPorCargo.set(a.cargo, lista);
    }
    return resueltos.cargos.map((c) => {
      const nombreEmpresa =
        c.empresa_nombre ||
        (modoCarga === "REFERENCIA" ? EMPRESA_CATALOGO : empresaDestino?.nombre ?? "");
      const existente = nombreEmpresa ? conocidas.get(normalizarNombreEmpresa(nombreEmpresa)) : undefined;
      const tipoEmpresa = existente?.tamano ?? c.empresa_tipo ?? (modoCarga === "REFERENCIA" ? EMPRESA_CATALOGO_TIPO : null);
      return {
        cargo: c,
        nombreEmpresa,
        nueva: Boolean(nombreEmpresa) && !existente,
        tipoEmpresa,
        sinEmpresa: !nombreEmpresa,
        actualiza: yaCargados.has(
          `${normalizarNombreEmpresa(nombreEmpresa)}|${modoCarga}|${c.codigo_cargo}`,
        ),
        avisos: avisosPorCargo.get(c.codigo_cargo) ?? [],
        bandas: modoCarga === "REFERENCIA" ? bandasPorCodigo.get(c.codigo_cargo) ?? [] : [],
      };
    });
  }, [resueltos, bandasCarga, empresas.data, empresaDestino, modoCarga, cargos.data]);

  const tarjetasFiltradas = useMemo(() => {
    const q = normalizarNombreEmpresa(busqueda);
    if (!q) return tarjetas;
    return tarjetas.filter((t) =>
      normalizarNombreEmpresa(`${t.cargo.nombre} ${t.cargo.codigo_cargo} ${t.nombreEmpresa} ${t.cargo.nombre_area}`).includes(q),
    );
  }, [tarjetas, busqueda]);

  const empresasNuevas = useMemo(
    () => new Set(tarjetas.filter((t) => t.nueva).map((t) => normalizarNombreEmpresa(t.nombreEmpresa))).size,
    [tarjetas],
  );
  const faltaEmpresa = tarjetas.some((t) => t.sinEmpresa);

  // Resumen de validación previo al guardado. Solo los problemas estructurales
  // (código o nombre ausente, códigos repetidos, filas sin empresa) bloquean.
  const resumen = useMemo(() => {
    const codigos = new Set(cargosCarga.map((c) => c.codigo_cargo));
    const codigosConBanda = new Set(bandasCarga.map((b) => b.codigo_cargo));
    const conRemuneracion = [...codigosConBanda].filter((c) => codigos.has(c)).length;
    const sinCargo = [...codigosConBanda].filter((c) => !codigos.has(c));
    const sinRemuneracion = [...codigos].filter((c) => !codigosConBanda.has(c));
    const sinSueldo = cargosCarga.filter((c) => c.sueldo === null).length;
    return {
      cargos: cargosCarga.length,
      bandas: bandasCarga.length,
      conRemuneracion,
      sinCargo,
      sinRemuneracion,
      sinSueldo,
      avisos: resueltos.avisos.length,
      errores: erroresCarga,
    };
  }, [cargosCarga, bandasCarga, resueltos.avisos, erroresCarga]);

  const puedeGuardar =
    !!cargosCarga.length && !faltaEmpresa && !erroresCarga.length && revisado && !importMut.isPending;

  const filtrados = useMemo(
    () =>
      (cargos.data ?? []).filter(
        (c) =>
          (!filtroEmpresa || c.empresa_id === filtroEmpresa) && (!filtroTipo || c.tipo === filtroTipo),
      ),
    [cargos.data, filtroEmpresa, filtroTipo],
  );

  const sinEmpresas = !empresas.isLoading && !empresas.data?.length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">Cargos</h1>

      {sinEmpresas && (
        <p className="text-sm text-muted-foreground">
          Primero registra una empresa para poder crear cargos.
        </p>
      )}

      <section className="import-panel">
        <div className="import-heading">
          <div><p className="eyebrow">Carga masiva</p><h2>Cargar datos</h2><p>Usa una planilla para cargos propios o las dos planillas de la encuesta para el catálogo.</p></div>
          <FileSpreadsheet aria-hidden="true" />
        </div>
        <div className="import-mode" role="group" aria-label="Tipo de carga">
          <Button type="button" variant={modoCarga === "INTERNO" ? "default" : "outline"} onClick={() => { setModoCarga("INTERNO"); setBandasCarga([]); }}>Cargos de empresa</Button>
          <Button type="button" variant={modoCarga === "REFERENCIA" ? "default" : "outline"} onClick={() => setModoCarga("REFERENCIA")}>Catálogo de encuesta</Button>
        </div>
        {modoCarga === "INTERNO" ? (
          <label className="text-sm"><span className="mb-1 block text-muted-foreground">Empresa de destino (opcional si la planilla trae la columna Empresa)</span><select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)}><option value="">Detectar desde la planilla</option>{(empresas.data ?? []).map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select></label>
        ) : (
          <p className="text-sm text-muted-foreground">El catálogo se guarda en la empresa de referencia «{EMPRESA_CATALOGO}», que se crea automáticamente si no existe.</p>
        )}
        <div className="import-files">
          <label className="file-picker"><Upload aria-hidden="true" /><span><strong>{modoCarga === "INTERNO" ? "Planilla de cargos" : "Encuesta Piloto"}</strong><small>{archivoCargos || "CSV o XLSX"}</small></span><input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => cargarEstructura(e.target.files?.[0])} /></label>
          {modoCarga === "REFERENCIA" && <label className="file-picker"><Upload aria-hidden="true" /><span><strong>Encuesta Piloto Remuneraciones</strong><small>{archivoBandas || "XLSX"}</small></span><input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => cargarBandas(e.target.files?.[0])} /></label>}
        </div>
        <details className="criteria-summary"><summary>Ver formato esperado</summary><div>Se acepta «ID Cargo» o «Código del cargo» junto al nombre del cargo, los códigos de Área, Subárea y Nivel Jerárquico (se traducen con el Diccionario), la descripción u Objetivo del cargo, Funciones principales, Responsabilidades, Requisitos de formación, Experiencia requerida y la remuneración bruta mensual (solo informativa). Las remuneraciones de la encuesta se cruzan por ID Cargo.</div></details>
        {diccionarioArchivo.length > 0 && (
          <div className="import-preview">
            <strong>El archivo trae una hoja Diccionario</strong>
            <p>{diccionarioArchivo.length} entradas. Puedes sumarlas a tu diccionario sin reemplazar las actuales.</p>
            <Button type="button" variant="outline" disabled={diccMut.isPending} onClick={() => diccMut.mutate()}>
              {diccMut.isPending ? "Agregando…" : "Agregar al diccionario"}
            </Button>
            {resultadoDicc && <p>{resultadoDicc}</p>}
          </div>
        )}
        {(cargosCarga.length > 0 || erroresCarga.length > 0) && (
          <div className="import-preview">
            <strong>Resumen de validación</strong>
            <p>✓ {resumen.cargos} {modoCarga === "INTERNO" ? "cargos internos" : "cargos de referencia"} detectados · {empresasNuevas} empresas nuevas</p>
            {modoCarga === "REFERENCIA" && (
              <>
                <p>✓ {resumen.bandas} registros de remuneraciones detectados</p>
                <p>✓ {resumen.conRemuneracion} de {resumen.cargos} cargos de referencia tienen remuneraciones</p>
                {resumen.sinRemuneracion.length > 0 && (
                  <p className="text-amber-700">⚠ {resumen.sinRemuneracion.length} cargos sin remuneración informada (se guardan igual): {resumen.sinRemuneracion.slice(0, 6).join(", ")}{resumen.sinRemuneracion.length > 6 ? "…" : ""}</p>
                )}
                {resumen.sinCargo.length > 0 && (
                  <p className="text-amber-700">⚠ {resumen.sinCargo.length} IDs de remuneraciones sin cargo en el catálogo: {resumen.sinCargo.slice(0, 6).join(", ")}{resumen.sinCargo.length > 6 ? "…" : ""}</p>
                )}
                {resumen.bandas === 0 && <p className="text-amber-700">⚠ Aún no cargas el archivo de remuneraciones.</p>}
              </>
            )}
            {modoCarga === "INTERNO" && resumen.sinSueldo > 0 && (
              <p className="text-amber-700">⚠ {resumen.sinSueldo} cargos sin remuneración en la planilla (se guardan como dato no disponible).</p>
            )}
            {resumen.avisos > 0 && <p className="text-amber-700">⚠ {resumen.avisos} datos faltantes o códigos fuera del diccionario (detalle en cada tarjeta).</p>}
            {erroresCarga.length > 0 && <p className="text-destructive">⚠ {erroresCarga.length} inconsistencias que impiden guardar:</p>}
            {erroresCarga.slice(0, 5).map((e) => <p key={e} className="text-destructive">{e}</p>)}
            {erroresCarga.length > 5 && <p className="text-destructive">…y {erroresCarga.length - 5} más.</p>}
            {faltaEmpresa && <p className="text-destructive">Hay filas sin empresa: agrégala en la planilla o elige una empresa de destino.</p>}
          </div>
        )}

        {cargosCarga.length > 0 && (
          <div className="import-review">
            <input className="import-search" placeholder="Buscar cargo, código o empresa…" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setVisibles(12); }} />
            <div className="import-cards">
              {tarjetasFiltradas.slice(0, visibles).map((t, i) => (
                <article key={`${t.cargo.codigo_cargo}-${i}`} className={`import-card${t.sinEmpresa ? " is-problema" : ""}`}>
                  <header>
                    <div>
                      <strong>{t.cargo.nombre}</strong>
                      <small>
                        {t.cargo.codigo_cargo} · {modoCarga === "INTERNO" ? "Interno" : "Referencia"} ·{" "}
                        {t.actualiza ? "actualiza un cargo existente" : "cargo nuevo"}
                      </small>
                    </div>
                    <span className={`empresa-tag${t.nueva ? " is-nueva" : ""}`}>
                      {t.sinEmpresa ? "Sin empresa" : `${t.nombreEmpresa}${t.tipoEmpresa ? ` · ${t.tipoEmpresa}` : ""}${t.nueva ? " · nueva" : ""}`}
                    </span>
                  </header>
                  <dl>
                    <div><dt>Área</dt><dd>{[t.cargo.codigo_area, t.cargo.nombre_area].filter(Boolean).join(" · ") || "—"}</dd></div>
                    <div><dt>Subárea</dt><dd>{[t.cargo.codigo_subarea, t.cargo.nombre_subarea].filter(Boolean).join(" · ") || "—"}</dd></div>
                    <div><dt>Nivel</dt><dd>{[t.cargo.codigo_nivel_jerarquico, t.cargo.nivel_jerarquico].filter(Boolean).join(" · ") || "—"}</dd></div>
                  </dl>
                  {t.avisos.length > 0 && (
                    <ul className="import-card-avisos">
                      {t.avisos.map((a) => <li key={a}>{a}</li>)}
                    </ul>
                  )}
                  {(() => {
                    const clave = `${t.cargo.codigo_cargo}-${i}`;
                    const abierto = detalleTarjeta === clave;
                    return (
                      <>
                        <button type="button" className="detail-toggle" onClick={() => setDetalleTarjeta(abierto ? null : clave)}>
                          {abierto ? "Ocultar detalle" : "Mostrar detalle"}
                        </button>
                        {abierto && (
                          <div className="detail-block">
                            <dl>
                              <div><dt>Experiencia</dt><dd>{t.cargo.experiencia_requerida || "—"}</dd></div>
                              <div><dt>Formación</dt><dd>{t.cargo.requisitos_formacion || "—"}</dd></div>
                              {t.cargo.sueldo !== null && <div><dt>Remuneración</dt><dd>{t.cargo.sueldo}</dd></div>}
                              <div><dt>Descripción</dt><dd>{t.cargo.descripcion || "—"}</dd></div>
                            </dl>
                            {t.bandas.length > 0 && (
                              <ul className="import-card-bandas">
                                {t.bandas.map((b) => (
                                  <li key={b.tipo_empresa}>
                                    <span>{b.tipo_empresa}</span> P25 {b.p25 ?? "—"} · P50 {b.p50 ?? "—"} · P75 {b.p75 ?? "—"} · Prom. {b.promedio ?? "—"}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </article>
              ))}
            </div>
            {tarjetasFiltradas.length > visibles && (
              <Button type="button" variant="outline" onClick={() => setVisibles((v) => v + 12)}>
                Ver más ({tarjetasFiltradas.length - visibles} restantes)
              </Button>
            )}
            <label className="import-confirm">
              <input type="checkbox" checked={revisado} onChange={(e) => setRevisado(e.target.checked)} />
              <span>Revisé la vista previa y los datos están correctos</span>
            </label>
          </div>
        )}

        <div className="import-actions"><Button type="button" variant="outline" onClick={descargarPlantilla}>Descargar plantilla</Button><Button type="button" disabled={!puedeGuardar} onClick={() => importMut.mutate()}>{importMut.isPending ? "Cargando…" : "Guardar datos"}</Button></div>
        {importMut.data && <p className="text-sm">Carga lista: {importMut.data.empresas} empresas nuevas, {importMut.data.creados} cargos nuevos, {importMut.data.actualizados} actualizados y {importMut.data.bandas} bandas.</p>}
      </section>

      <form
        className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          createMut.mutate();
        }}
      >
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Empresa</span>
          <select
            className="w-full rounded-md border bg-background px-3 py-2"
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value)}
            required
          >
            <option value="">Selecciona…</option>
            {(empresas.data ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Tipo</span>
          <select
            className="w-full rounded-md border bg-background px-3 py-2"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as CargoTipo)}
          >
            <option value="INTERNO">Interno</option>
            <option value="REFERENCIA">Referencia</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Nombre</span>
          <input
            className="w-full rounded-md border bg-background px-3 py-2"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">
            Sueldo (informativo, no se usa para homologar)
          </span>
          <input
            type="number"
            min="0"
            step="1"
            className="w-full rounded-md border bg-background px-3 py-2"
            value={sueldo}
            onChange={(e) => setSueldo(e.target.value)}
          />
        </label>
        <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
          {CAMPOS_ESTRUCTURALES.map((c) => (
            <label key={c.clave} className="text-sm">
              <span className="mb-1 block text-muted-foreground">{c.etiqueta}</span>
              <input
                className="w-full rounded-md border bg-background px-3 py-2"
                value={estructurales[c.clave]}
                onChange={(e) =>
                  setEstructurales((prev) => ({ ...prev, [c.clave]: e.target.value }))
                }
              />
            </label>
          ))}
        </div>
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block text-muted-foreground">Descripción</span>
          <textarea
            className="w-full rounded-md border bg-background px-3 py-2"
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </label>
        <details className="rounded-md border p-3 sm:col-span-2">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            Atributos semánticos (opcionales)
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {ATRIBUTOS_SEMANTICOS.map((a) => (
              <label key={a.clave} className="text-sm">
                <span className="mb-1 block text-muted-foreground">{a.etiqueta}</span>
                <textarea
                  className="w-full rounded-md border bg-background px-3 py-2"
                  rows={2}
                  value={atributos[a.clave]}
                  onChange={(e) =>
                    setAtributos((prev) => ({ ...prev, [a.clave]: e.target.value }))
                  }
                />
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Se usan solo en el análisis semántico. Lo que dejes vacío se envía vacío y no se completa
            automáticamente.
          </p>
        </details>

        <div className="sm:col-span-2">
          <Button
            type="submit"
            disabled={createMut.isPending}
          >
            Agregar cargo
          </Button>
        </div>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-3 text-sm">
        <select
          className="rounded-md border bg-background px-3 py-2"
          value={filtroEmpresa}
          onChange={(e) => setFiltroEmpresa(e.target.value)}
        >
          <option value="">Todas las empresas</option>
          {(empresas.data ?? []).map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border bg-background px-3 py-2"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
        >
          <option value="">Todos los tipos</option>
          <option value="INTERNO">Interno</option>
          <option value="REFERENCIA">Referencia</option>
        </select>
      </div>

      {cargos.isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : !filtrados.length ? (
        <p className="text-sm text-muted-foreground">No hay cargos que coincidan.</p>
      ) : (
        <div className="data-table">
          <div className="data-row data-head">
            <span>Código</span><span>Cargo</span><span>Empresa</span><span>Tipo</span><span>Área</span><span>Sueldo</span><span />
          </div>
          {filtrados.map((c) => {
            const abierto = detalleFila === c.id;
            return (
              <div key={c.id} className="data-group">
                <div className="data-row">
                  <span data-label="Código" className="data-code">{c.codigo_cargo || "—"}</span>
                  <span data-label="Cargo" className="data-main">{c.nombre}</span>
                  <span data-label="Empresa">{c.empresas?.nombre ?? "—"}</span>
                  <span data-label="Tipo">{c.tipo === "INTERNO" ? "Interno" : "Referencia"}</span>
                  <span data-label="Área">{c.nombre_area || "—"}</span>
                  <span data-label="Sueldo">{formatSueldo(c.sueldo)}</span>
                  <span className="data-actions">
                    <button type="button" className="detail-toggle" onClick={() => setDetalleFila(abierto ? null : c.id)}>
                      {abierto ? "Ocultar detalle" : "Mostrar detalle"}
                    </button>
                    <button type="button" className="row-delete" onClick={() => deleteMut.mutate(c.id)}>Eliminar</button>
                  </span>
                </div>
                {abierto && (
                  <div className="detail-block">
                    <dl>
                      {CAMPOS_ESTRUCTURALES.filter((k) => c[k.clave]).map((k) => (
                        <div key={k.clave}><dt>{k.etiqueta}</dt><dd>{String(c[k.clave])}</dd></div>
                      ))}
                      <div><dt>Descripción</dt><dd>{c.descripcion || "—"}</dd></div>
                      <div>
                        <dt>Atributos semánticos</dt>
                        <dd>{contarAtributos(c.atributos_semanticos)} de {ATRIBUTOS_SEMANTICOS.length} completos</dd>
                      </div>
                    </dl>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
