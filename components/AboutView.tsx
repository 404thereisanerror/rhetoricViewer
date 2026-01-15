import React from 'react';

export const AboutView: React.FC = () => {
    return (
        <div className="bg-black/30 backdrop-blur-3xl p-8 lg:p-16 rounded-xl border border-white/10 shadow-2xl max-w-5xl mx-auto animate-fade-in">
            <div className="mb-16 text-center">
                <h2 className="text-label text-accent-blue mb-6 opacity-60 uppercase">Über das Projekt</h2>
                <h3 className="text-h1 mb-6">
                    Sprache als Spiegel <br/><span className="italic opacity-80">der Macht & Emotion</span>
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
                <section className="space-y-8">
                    <h4 className="text-label text-white/30 border-b border-white/5 pb-4 uppercase">Die Technologie</h4>
                    <p className="text-body text-white/60">
                        Diese Anwendung nutzt <strong className="text-white/80 font-semibold">Gemini 3 Pro</strong>, ein hochmodernes Sprachmodell, um Texte auf rhetorische und manipulative Muster zu untersuchen. Im Gegensatz zu einfachen Filtern analysiert die KI jeden Satz unter Berücksichtigung des <strong className="text-white/80 font-semibold">semantischen Kontexts</strong>, um Ironie, Frames und emotionale Appelle präzise zu erkennen.
                    </p>
                </section>

                <section className="space-y-8">
                    <h4 className="text-label text-white/30 border-b border-white/5 pb-4 uppercase">Analyse-Vektoren</h4>
                    <ul className="space-y-10 text-[0.95rem] text-white/50">
                        <li className="flex gap-5">
                            <span className="text-accent-blue font-bold text-xs mt-1">01</span>
                            <div>
                                <strong className="text-white/80 block mb-2 font-semibold">Emotionale Kartierung</strong>
                                <span className="leading-relaxed">Sätze werden dem Circumplex-Modell zugeordnet, um die atmosphärische Ladung visuell zu erfassen.</span>
                            </div>
                        </li>
                        <li className="flex gap-5">
                            <span className="text-accent-blue font-bold text-xs mt-1">02</span>
                            <div>
                                <strong className="text-white/80 block mb-2 font-semibold">Hintergrund-Check</strong>
                                <span className="leading-relaxed">Wir identifizieren Eigentümerstrukturen, um potenzielle Interessenkonflikte nach dem Chomsky-Modell aufzuzeigen.</span>
                            </div>
                        </li>
                        <li className="flex gap-5">
                            <span className="text-accent-blue font-bold text-xs mt-1">03</span>
                            <div>
                                <strong className="text-white/80 block mb-2 font-semibold">Bias durch Omission</strong>
                                <span className="leading-relaxed">Die KI detektiert Themenbereiche, die im Artikel fehlen könnten, um einseitige Berichterstattung zu entlarven.</span>
                            </div>
                        </li>
                    </ul>
                </section>
            </div>

            <div className="mt-20 p-10 lg:p-12 bg-white/5 border border-white/10 rounded-xl border-dashed">
                <h4 className="text-label text-white/40 mb-8 uppercase">Unser Manifest</h4>
                <p className="text-lg lg:text-xl leading-relaxed text-white/70 italic text-justify font-serif font-medium opacity-90">
                    "Rhetorik-Scanner" ist ein Experiment zur Schärfung der Medienkompetenz. Es soll helfen, manipulative Sprache nicht nur intuitiv zu spüren, sondern sie analytisch zu dekonstruieren. In einer Zeit der Informationsüberflutung ist die Fähigkeit, den "Vibe" von harten Fakten zu trennen, eine demokratische Kernkompetenz.
                </p>
            </div>
        </div>
    );
};