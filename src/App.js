import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `Du er en innholdsassistent for Heim Rekruttering — et DNV-sertifisert rekrutteringsbyrå i Sandnessjøen på Helgeland.

SELSKAPSPROFIL:
Verdiforslag: "Vi finner folk som passer — ikke bare på papiret"
Differensiering: Stillingspodcast, video fra arbeidsplassen, sterk lokal forankring, prøvetidsoppfølging i inntil 6 måneder.
Gjennomførte oppdrag: SAR AS, Torsjon AS, Navet Helgeland, Havbruksnettverk Helgeland, Sentrum Næringshage, Nothuset AS.

MARKEDSSITUASJON:
- Nordland har 1,8 % arbeidsledighet — blant Norges laveste
- 50 % av NHO-bedriftene i Nordland har forsøkt å rekruttere uten å lykkes
- Bare 15 % av norske bedrifter bruker rekrutteringsbyrå
- En feilansettelse koster 500 000–1 million kroner
- 65 % av ansatte planlegger ikke å bytte jobb i 2026 — passive kandidater er viktigere enn noensinne

TONE OF VOICE:
Stemmen er Christian Wiik Kynsveen: muntlig, reflektert og personlig. Som noen med lang erfaring som forteller deg noe de faktisk mener.

ALDRI SKRIV:
- «Brenner for», «helhetlig tilnærming», «dedikert team», «løfte i flokk»
- «Hva tenker du?» eller engasjementsfeller på slutten
- «Vi i Heim Rekruttering er stolte av å...»
- Overdrevne emojier eller hashtagger

STRUKTUR FOR HVERT INNLEGG:
1. Åpning — én konkret observasjon leseren kjenner igjen. Ikke et tall, ikke en påstand.
2. Utdyp observasjonen med én til to setninger.
3. Vendepunktet — kort og kontant. Én linje som snur perspektivet. Står alene.
4. Konsekvensen — sett fra leserens ståsted.
5. Kjernen — ett kort spørsmål eller setning.
6. Konkrete spørsmål eller eksempler som egne linjer.
7. Koblingen til Heim — uten å skryte. «Det er derfor vi alltid...»
8. Avslutning — gjerne «Ikke fordi X, men fordi Y».
9. Signatur: «Heim Rekruttering» på egen linje, maks 3 hashtagger.

FORMAT:
- Korte avsnitt, gjerne én eller to setninger
- Enkeltsetninger kan stå alene for å gi trykk
- Aldri bullet points i innlegget
- LinkedIn: 150–250 ord, rent prosa
- Facebook: 80–150 ord, kortere og litt mer uformelt

TO PROFILER:
PROFIL 1 — Christian (personlig LinkedIn):
Skriv i første person som Christian Wiik Kynsveen. Faglig refleksjon fra egne erfaringer. Publiseres tirsdag.

PROFIL 2 — Heim mot bedrifter (LinkedIn/Facebook):
Skriv på vegne av Heim Rekruttering til SMB-ledere og HR-ansvarlige. Anerkjenner lederens virkelighet. Publiseres torsdag.`;

const PROFILES = [
  { id: "christian", label: "Christian", sub: "Personlig LinkedIn · Tirsdag", color: "#1a1a2e" },
  { id: "heim", label: "Heim mot bedrifter", sub: "LinkedIn / Facebook · Torsdag", color: "#16213e" },
];

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "facebook", label: "Facebook" },
];

const COMMANDS = [
  { id: "ukesplan", label: "Ukesplan", desc: "Finn tema og skriv to innlegg" },
  { id: "innlegg", label: "Skriv innlegg", desc: "Oppgi tema nedenfor" },
  { id: "juster", label: "Juster innlegg", desc: "Lim inn innlegg nedenfor" },
];

export default function HeimApp() {
  const [profile, setProfile] = useState("christian");
  const [platform, setPlatform] = useState("linkedin");
  const [command, setCommand] = useState("innlegg");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef(null);

  useEffect(() => {
    if (output && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [output]);

  const buildPrompt = () => {
    const profileLabel = profile === "christian"
      ? "Christian Wiik Kynsveen (personlig LinkedIn, første person)"
      : "Heim mot bedrifter (på vegne av selskapet, til SMB-ledere)";
    const platformLabel = platform === "linkedin" ? "LinkedIn" : "Facebook";

    if (command === "ukesplan") {
      return `Søk mentalt i kjente trender innen arbeidsmarked, rekruttering og HR i Norge mars 2026. Velg to gode tema — ett per profil. Skriv to ferdige innlegg:

INNLEGG 1 — Christian · Tirsdag · LinkedIn
INNLEGG 2 — Heim mot bedrifter · Torsdag · LinkedIn/Facebook

Presenter tema og begrunnelse (én linje) før hvert innlegg.${input ? `\n\nTilleggsinformasjon: ${input}` : ""}`;
    }

    if (command === "juster") {
      return `Juster dette innlegget for profil: ${profileLabel}, plattform: ${platformLabel}.${input ? `\n\nInnlegg:\n${input}` : "\n\n[Innlegg ikke oppgitt — be brukeren lime inn innlegget]"}`;
    }

    // innlegg
    return `Skriv ett innlegg for profil: ${profileLabel}, plattform: ${platformLabel}.${input ? `\n\nTema: ${input}` : "\n\n[Tema ikke oppgitt — velg et godt tema selv basert på rekrutteringsfaget og Helgeland-markedet]"}`;
  };

  const generate = async () => {
    setLoading(true);
    setOutput("");
    setCopied(false);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildPrompt() }],
        }),
      });

      const data = await response.json();
      const text = data.content?.map(b => b.text || "").join("") || "Noe gikk galt. Prøv igjen.";
      setOutput(text);
    } catch (err) {
      setOutput("Kunne ikke koble til API. Sjekk tilkoblingen og prøv igjen.");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f2ee",
      fontFamily: "'Georgia', serif",
      padding: "0",
    }}>
      {/* Header */}
      <div style={{
        background: "#1a1a2e",
        padding: "28px 40px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}>
        <div style={{
          width: "36px",
          height: "36px",
          background: "#c8a96e",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          fontWeight: "bold",
          color: "#1a1a2e",
          fontFamily: "serif",
        }}>H</div>
        <div>
          <div style={{ color: "#f5f2ee", fontSize: "16px", fontWeight: "600", letterSpacing: "0.02em" }}>
            Heim Rekruttering
          </div>
          <div style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Innholdsassistent
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 24px" }}>

        {/* Kommando */}
        <Section title="Kommando">
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {COMMANDS.map(c => (
              <button key={c.id} onClick={() => setCommand(c.id)} style={{
                padding: "10px 18px",
                borderRadius: "6px",
                border: command === c.id ? "2px solid #1a1a2e" : "2px solid #ddd",
                background: command === c.id ? "#1a1a2e" : "white",
                color: command === c.id ? "#f5f2ee" : "#333",
                cursor: "pointer",
                fontSize: "14px",
                fontFamily: "Georgia, serif",
                transition: "all 0.15s",
              }}>
                <div style={{ fontWeight: "600" }}>{c.label}</div>
                <div style={{ fontSize: "11px", opacity: 0.7, marginTop: "2px" }}>{c.desc}</div>
              </button>
            ))}
          </div>
        </Section>

        {/* Profil og plattform */}
        {command !== "ukesplan" && (
          <>
            <Section title="Profil">
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {PROFILES.map(p => (
                  <button key={p.id} onClick={() => setProfile(p.id)} style={{
                    padding: "10px 18px",
                    borderRadius: "6px",
                    border: profile === p.id ? "2px solid #1a1a2e" : "2px solid #ddd",
                    background: profile === p.id ? "#1a1a2e" : "white",
                    color: profile === p.id ? "#f5f2ee" : "#333",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontFamily: "Georgia, serif",
                    transition: "all 0.15s",
                    textAlign: "left",
                  }}>
                    <div style={{ fontWeight: "600" }}>{p.label}</div>
                    <div style={{ fontSize: "11px", opacity: 0.7, marginTop: "2px" }}>{p.sub}</div>
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Plattform">
              <div style={{ display: "flex", gap: "10px" }}>
                {PLATFORMS.map(p => (
                  <button key={p.id} onClick={() => setPlatform(p.id)} style={{
                    padding: "10px 24px",
                    borderRadius: "6px",
                    border: platform === p.id ? "2px solid #1a1a2e" : "2px solid #ddd",
                    background: platform === p.id ? "#1a1a2e" : "white",
                    color: platform === p.id ? "#f5f2ee" : "#333",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontFamily: "Georgia, serif",
                    fontWeight: "600",
                    transition: "all 0.15s",
                  }}>{p.label}</button>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* Input */}
        <Section title={command === "juster" ? "Innlegg som skal justeres" : command === "ukesplan" ? "Tilleggsinformasjon (valgfritt)" : "Tema eller instruksjoner"}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={
              command === "juster" ? "Lim inn innlegget her..."
              : command === "ukesplan" ? "F.eks. fokuser på passiv kandidat-tematikk..."
              : "F.eks. «feilansettelse», «stillingspodcast», «strukturerte intervjuer»..."
            }
            style={{
              width: "100%",
              minHeight: "100px",
              padding: "14px",
              borderRadius: "6px",
              border: "2px solid #ddd",
              fontSize: "14px",
              fontFamily: "Georgia, serif",
              lineHeight: "1.6",
              resize: "vertical",
              background: "white",
              color: "#1a1a2e",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
        </Section>

        {/* Generer-knapp */}
        <button
          onClick={generate}
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            background: loading ? "#888" : "#1a1a2e",
            color: "#f5f2ee",
            border: "none",
            borderRadius: "6px",
            fontSize: "15px",
            fontFamily: "Georgia, serif",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: "0.03em",
            transition: "background 0.15s",
            marginBottom: "32px",
          }}
        >
          {loading ? "Genererer..." : "Generer innlegg →"}
        </button>

        {/* Output */}
        {output && (
          <div ref={outputRef} style={{
            background: "white",
            borderRadius: "8px",
            border: "2px solid #1a1a2e",
            padding: "28px",
            position: "relative",
          }}>
            <div style={{
              fontSize: "11px",
              color: "#c8a96e",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "16px",
              fontFamily: "Georgia, serif",
            }}>Ferdig innlegg</div>
            <div style={{
              fontSize: "15px",
              lineHeight: "1.75",
              color: "#1a1a2e",
              whiteSpace: "pre-wrap",
              fontFamily: "Georgia, serif",
            }}>{output}</div>
            <button
              onClick={copy}
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                background: copied ? "#2d6a4f" : "#f5f2ee",
                color: copied ? "white" : "#1a1a2e",
                border: "2px solid #1a1a2e",
                borderRadius: "6px",
                fontSize: "13px",
                fontFamily: "Georgia, serif",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >{copied ? "✓ Kopiert" : "Kopier innlegg"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{
        fontSize: "11px",
        color: "#888",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginBottom: "10px",
        fontFamily: "Georgia, serif",
      }}>{title}</div>
      {children}
    </div>
  );
}
