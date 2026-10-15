import { ArrowRight, BookOpenCheck, GraduationCap, LockKeyhole } from "lucide-react";
import { motion } from "framer-motion";

const translations = {
  tr: {
    eyebrow: "2209 AKADEMİ",
    headline: "Araştırma fikrini, sağlam bir projeye dönüştür.",
    introduction: "Fikrini netleştir, araştırmanı planla ve proje sürecini adım adım ilerlet.",
    journey: "Proje yolculuğun",
    steps: ["Fikrini tanımla", "Literatürü keşfet", "Yöntemini planla"],
    workspace: "Çalışma alanına giriş",
    access: "Devam etmek için erişim şifreni gir.",
    password: "Erişim şifresi",
    submit: "Akademiye giriş yap",
    secure: "Şifre korumalı erişim",
  },
  en: {
    eyebrow: "2209 ACADEMY",
    headline: "Turn your research idea into a strong project.",
    introduction: "Shape your idea, plan your research, and move through your project one step at a time.",
    journey: "Your project journey",
    steps: ["Define your idea", "Explore the literature", "Plan your method"],
    workspace: "Enter your workspace",
    access: "Enter your access password to continue.",
    password: "Access password",
    submit: "Enter the academy",
    secure: "Password-protected access",
  },
};

export default function Login({ password, setPassword, error, onSubmit, lang, onToggleLanguage }) {
  const t = translations[lang] ?? translations.tr;

  return (
    <div className="login-page min-h-screen">
      <motion.main
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="login-layout"
      >
        <section className="login-showcase" aria-label={t.eyebrow}>
          <div className="login-brand">
            <span className="login-brand-mark"><GraduationCap aria-hidden="true" /></span>
            <span>AI 2209 Akademi</span>
          </div>

          <div className="login-intro">
            <p className="login-eyebrow">{t.eyebrow}</p>
            <h1>{t.headline}</h1>
            <p className="login-description">{t.introduction}</p>
          </div>

          <div className="login-journey">
            <div className="login-journey-heading">
              <BookOpenCheck aria-hidden="true" />
              <span>{t.journey}</span>
            </div>
            <ol>
              {t.steps.map((step, index) => (
                <li key={step}>
                  <span className="login-step-number">{String(index + 1).padStart(2, "0")}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="login-showcase-footer">
            <span className="login-footer-line" />
            <span>AI 2209 Akademi</span>
          </div>
        </section>

        <section className="login-panel">
          <div className="login-panel-content">
            <div className="login-panel-heading">
              <span className="login-panel-icon"><LockKeyhole aria-hidden="true" /></span>
              <p className="login-panel-kicker">{t.eyebrow}</p>
              <button type="button" onClick={onToggleLanguage} className="login-language">
                {lang === "tr" ? "English" : "Türkçe"}
              </button>
            </div>
            <h2>{t.workspace}</h2>
            <p className="login-panel-description">{t.access}</p>

            <form className="login-form" onSubmit={onSubmit}>
              <label htmlFor="access-password">{t.password}</label>
              <input
                id="access-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "login-error" : undefined}
                required
              />
              {error ? <p id="login-error" className="login-error" role="alert">{error}</p> : null}
              <button type="submit" className="login-submit">
                <span>{t.submit}</span>
                <ArrowRight aria-hidden="true" />
              </button>
            </form>

            <div className="login-secure-note">
              <LockKeyhole aria-hidden="true" />
              <span>{t.secure}</span>
            </div>
          </div>
          <p className="login-copyright">© 2026 AI 2209 Akademi</p>
        </section>
      </motion.main>
    </div>
  );
}
