"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Loader2, Check, ShieldAlert, Zap, KeyRound, Eye, Lock, ArrowRight } from "lucide-react";
import Lenis from 'lenis';

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

// ─── 1. Nav Component ───
function Nav() {
  const router = useRouter();
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#000000]/80 backdrop-blur-md border-b border-[#474747] flex justify-between items-center px-6 md:px-8 py-3">
      <div className="text-2xl md:text-3xl font-black font-headline tracking-tighter text-white">
        ENTANGL
      </div>
      <nav className="hidden md:flex gap-8 items-center font-mono text-xs uppercase">
        <a href="#features" className="text-[#c6c6c6] hover:text-white transition-colors cursor-pointer">Network</a>
        <a href="#protocol" className="text-[#c6c6c6] hover:text-white transition-colors cursor-pointer">Protocol</a>
        <a href="#nodes" className="text-[#C6C6C6] hover:text-white transition-colors cursor-pointer">Nodes</a>
        <button
          onClick={() => router.push("/login")}
          className="bg-white text-black font-headline font-bold px-5 py-1.5 hover:bg-[#FF0000] hover:text-white transition-colors duration-200"
        >
          Login
        </button>
      </nav>
      {/* Mobile Nav Button */}
      <button
        onClick={() => router.push("/login")}
        className="md:hidden bg-white text-black font-headline font-bold px-4 py-1.5 hover:bg-[#FF0000] hover:text-white transition-colors text-sm"
      >
        Login
      </button>
    </header>
  );
}

// ─── 2. Hero Section ───
function Hero() {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const words = ["CHAT", "NETWORK", "DATA", "COMMS"];

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".hero-status", { opacity: 0, y: 10, duration: 0.5, delay: 0.2 })
        .from(".hero-title-line", {
          opacity: 0,
          y: 40,
          stagger: 0.1,
          duration: 0.8,
        })
        .from(".hero-image-wrap", { opacity: 0, scale: 0.9, rotateX: 10, duration: 1.5, ease: "power2.out" }, "-=0.6")
        .from(".hero-desc", { opacity: 0, y: 20, duration: 0.6 }, "-=0.8")
        .from(".hero-btn", { opacity: 0, scale: 0.95, duration: 0.5 }, "-=0.6");

      // Word flip animation (Seamless vertical slider instead of textContent replacement)
      const sliderTl = gsap.timeline({ repeat: -1 });
      words.forEach((_, i) => {
        // Wait 2.5s on the current word
        sliderTl.to({}, { duration: 2.5 })
          // Slide up to the next word
          .to(".word-slider", {
            y: `-${(i + 1) * 1.2}em`,
            duration: 0.6,
            ease: "back.inOut(1.2)"
          });
      });
      // Immediately reset to the very first word invisibly when reaching the duplicate at the end
      sliderTl.set(".word-slider", { y: "0em" });
    },
    { scope: container }
  );

  return (
    <section
      ref={container}
      className="min-h-screen flex flex-col justify-center px-6 md:px-8 lg:px-12 relative overflow-hidden grid-mask border-b border-[#474747] pt-24 md:pt-0"
    >
      <div className="scanlines z-10" />

      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-20 relative z-20">

        {/* Left: Text Content */}
        <div className="w-full md:w-1/2 flex flex-col">
          <div className="hero-status font-mono text-[9px] md:text-[10px] tracking-widest mb-6 flex flex-wrap gap-4 md:gap-8 border-b border-[#474747] pb-3 w-fit">
            <span className="text-[#919191]">LATENCY: 0.0004MS</span>
            <span className="text-[#FF0000] animate-pulse">ENTANGLEMENT_ACTIVE</span>
            <span className="text-[#c6c6c6] opacity-50">[ SYSTEM: SECURE ]</span>
          </div>

          <h1 className="font-headline font-bold text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1] tight-tracking uppercase mb-8 flex flex-col items-start w-full">
            <div className="hero-title-line overflow-visible text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] pb-1">
              QUANTUM
            </div>
            <div className="hero-title-line overflow-visible text-[#c6c6c6] pb-1">
              SECURED
            </div>
            <div className="hero-title-line overflow-hidden h-[1.2em] relative inline-flex items-center w-[7.5em] sm:w-[6.5em] bg-[#000000] mt-2 border border-[#474747] border-l-[8px] border-l-[#FF0000] shadow-[0_0_30px_rgba(255,0,0,0.15)] group">
              <div className="absolute inset-0 scanlines opacity-50 mix-blend-screen pointer-events-none z-10" />
              <div className="word-slider absolute top-0 left-0 w-full flex flex-col">
                {[...words, words[0]].map((w, i) => (
                  <span key={i} className="flex flex-col justify-center h-[1.2em] px-4 md:px-5 font-bold tracking-widest text-[#FF0000] drop-shadow-[0_0_10px_rgba(255,0,0,0.6)]">
                    {w}
                  </span>
                ))}
              </div>
              {/* Blinking cursor effect at the end of the box */}
              <span className="absolute right-4 md:right-5 top-1/2 -translate-y-1/2 w-[0.4em] h-[0.7em] bg-[#FF0000] animate-pulse shadow-[0_0_8px_rgba(255,0,0,0.8)] z-10" />
            </div>
          </h1>

          <div className="flex flex-col gap-8 max-w-xl">
            <p className="hero-desc text-[#c6c6c6] text-sm md:text-base leading-relaxed font-mono">
              Absolute cryptographic certainty. Entangl leverages true photon entanglement to generate unbreakable AES-256 keys, guaranteeing unconditional security against classical and quantum computing threats.
            </p>
            <div className="hero-btn">
              <button
                onClick={() => router.push("/login")}
                className="bg-white text-black font-headline font-bold text-sm md:text-base px-8 py-4 hover:bg-[#FF0000] hover:text-white transition-all duration-300 border border-transparent hover:border-[#FF0000] shadow-[0_0_0_0_rgba(255,0,0,0)] hover:shadow-[0_0_20px_0_rgba(255,0,0,0.4)] uppercase tracking-widest flex items-center justify-center gap-3 w-full sm:w-auto"
              >
                ACCESS CHAT
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Framed Image Container */}
        <div className="hero-image-wrap w-full md:w-1/2 flex justify-center lg:justify-end perspective-[1000px]">
          <div className="relative w-full aspect-square max-w-[450px] border border-[#474747] bg-[#0e0e0e] p-4 shadow-[0_0_50px_rgba(255,0,0,0.05)] transform-gpu hover:rotate-y-6 hover:rotate-x-6 transition-transform duration-700">
            {/* Tech corner accents */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#FF0000]" />
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#FF0000]" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#FF0000]" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#FF0000]" />

            <div className="w-full h-full relative overflow-hidden bg-black grid-mask">
              <Image
                src="/hero.png"
                alt="Quantum Node"
                fill
                className="object-cover mix-blend-screen opacity-90 transition-transform duration-1000 hover:scale-110"
                priority
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

// ─── 3. QKD Process Loop Animation + Table ───
const QKD_STEPS_PLAY = [
  { label: "Initializing quantum channel", detail: "Establishing entangled qubit pairs between parties" },
  { label: "Generating entangled states", detail: "Creating Bell/GHZ states via quantum circuits" },
  { label: "Measuring in random bases", detail: "Alice and Bob independently choose measurement bases" },
  { label: "Sifting key bits", detail: "Discarding bits where bases didn't match" },
  { label: "Calculating QBER", detail: "Estimating error rate to detect eavesdroppers" },
  { label: "Distributing encrypted key", detail: "256-bit AES key delivered via RSA-OAEP" },
];

const QKD_STEPS = [
  { id: "001", name: "Initializing quantum channel", state: "[ VACUUM_STABILIZED ]", load: "0.02%" },
  { id: "002", name: "Generating entangled states", state: "[ BELL_STATE_PAIRS ]", load: "4.89%" },
  { id: "003", name: "Measuring in random bases", state: "[ STOCHASTIC_FILTER ]", load: "12.4%" },
  { id: "004", name: "Sifting key bits", state: "[ PARITY_CHECKING ]", load: "2.11%" },
  { id: "005", name: "Calculating QBER", state: "[ EVE_DETECTED_0.00% ]", load: "0.95%", stress: true },
  { id: "006", name: "Distributing encrypted key", state: "[ AES-256-QUANTUM ]", load: "0.01%" },
];

function QKDProcessTable() {
  const container = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"running" | "done">("running");

  useGSAP(
    () => {
      gsap.from(".process-row", {
        scrollTrigger: {
          trigger: container.current,
          start: "top 80%",
        },
        opacity: 0,
        x: -20,
        stagger: 0.1,
        duration: 0.6,
        ease: "power2.out",
      });
    },
    { scope: container }
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => {
        if (prev < QKD_STEPS_PLAY.length - 1) return prev + 1;
        setPhase("done");
        setTimeout(() => { setStep(0); setPhase("running"); }, 3000);
        return prev;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="protocol" ref={container} className="py-20 md:py-28 px-6 md:px-8 border-b border-[#474747] bg-black">
      <div className="mb-12 md:mb-16 flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-[#474747] pb-6">
        <h2 className="font-headline font-bold text-2xl md:text-4xl uppercase tight-tracking">
          QKD_PROCESS_FLOW
        </h2>
        <span className="font-mono text-[#919191] text-[10px] md:text-xs">001_EXECUTION_SEQUENCE</span>
      </div>

      {/* Embedded Loop Animation */}
      <div className="w-full max-w-2xl mb-16 mx-auto">
        <div className="border border-[#474747] bg-[#0e0e0e]/50 p-6 font-mono text-xs md:text-sm shadow-[0_0_30px_rgba(255,0,0,0.05)] relative overflow-hidden">
          <div className="scanlines mix-blend-overlay opacity-30 absolute inset-0 z-0 pointer-events-none" />
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#474747] relative z-10">
            <span className="text-[#FF0000] tracking-widest text-[10px] uppercase">{phase === "done" ? "Process Terminated" : "Active Sequence"}</span>
            {phase === "running" ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Check className="h-4 w-4 text-[#FF0000]" />}
          </div>
          <div className="space-y-4 relative z-10">
            {QKD_STEPS_PLAY.map((s, i) => {
              const isDone = i < step || phase === "done";
              const isActive = i === step && phase === "running";
              return (
                <div key={s.label} className={`flex items-start gap-4 transition-all duration-300 ${isDone ? 'opacity-40' : isActive ? 'opacity-100' : 'opacity-20'}`}>
                  <div className="mt-0.5 shrink-0 flex items-center justify-center w-4 h-4">
                    {isDone ? <Check className="h-3 w-3 text-[#c6c6c6]" /> : isActive ? <div className="h-2 w-2 bg-[#FF0000] shadow-[0_0_8px_rgba(255,0,0,0.8)] rounded-full animate-pulse" /> : <div className="h-2 w-2 border border-[#474747] rounded-full" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[10px] md:text-xs uppercase font-bold tracking-wider ${isActive ? "text-white" : "text-[#c6c6c6]"}`}>{s.label}</p>
                    {isActive && <p className="text-[9px] md:text-[10px] text-[#FF0000] mt-1 italic">{s.detail}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse font-mono text-[10px] md:text-xs min-w-[600px]">
          <thead>
            <tr className="text-[#919191] uppercase tracking-widest border-b border-[#474747]">
              <th className="text-left py-3 px-3 md:px-5 font-normal">Step_ID</th>
              <th className="text-left py-3 px-3 md:px-5 font-normal">Operation_Module</th>
              <th className="text-left py-3 px-3 md:px-5 font-normal">Data_State</th>
              <th className="text-right py-3 px-3 md:px-5 font-normal">System_Load</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#474747]">
            {QKD_STEPS.map((step) => (
              <tr key={step.id} className="process-row hover:bg-[#1b1b1b] transition-colors group cursor-default">
                <td className="py-5 px-3 md:px-5 text-[#FF0000] font-bold">{step.id}</td>
                <td className="py-5 px-3 md:px-5 text-sm md:text-base text-white uppercase font-headline">
                  {step.name}
                </td>
                <td className={`py-5 px-3 md:px-5 ${step.stress ? "text-[#FF0000]" : "text-[#c6c6c6]"}`}>
                  {step.state}
                </td>
                <td className="py-5 px-3 md:px-5 text-right">{step.load}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── 4. How It Works Grid ───
const HOW_IT_WORKS = [
  { num: "01", title: "Quantum Channel", desc: "PHOTONIC_CARRIER_WAVE_ESTABLISHED_VIA_FIBER_OR_FS_LINK" },
  { num: "02", title: "Key Extraction", desc: "POST_MEASUREMENT_BASIS_RECONCILIATION_PROTOCOL_ACTIVE" },
  { num: "03", title: "Eve Detection", desc: "QUANTUM_NO_CLONING_THEOREM_VIOLATION_TRIGGER_ID" },
  { num: "04", title: "Secure Chat", desc: "AES_X_SHA_AUTHENTICATED_MULTI_PARTY_MESSAGING_INTERFACE" },
];

function HowItWorksGrid() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.to(".hiw-card", {
        scrollTrigger: {
          trigger: container.current,
          start: "top 85%",
        },
        opacity: 1,
        y: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: "power3.out",
      });
    },
    { scope: container }
  );

  return (
    <section ref={container} className="py-20 md:py-28 px-6 md:px-8 bg-black">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-[#474747]">
        {HOW_IT_WORKS.map((item, i) => (
          <div
            key={item.num}
            className={`hiw-card opacity-0 translate-y-10 border-[#474747] ${i !== 0 && "border-t"
              } lg:border-t-0 md:border-r p-6 lg:p-10 hover:bg-[#1b1b1b] transition-colors group flex flex-col justify-between aspect-square lg:aspect-auto min-h-[250px]`}
          >
            <span className="font-headline font-black text-4xl lg:text-5xl text-[#474747] group-hover:text-white transition-colors duration-500">
              {item.num}
            </span>
            <div>
              <h3 className="font-headline font-bold text-lg lg:text-xl uppercase mb-3 text-white">
                {item.title}
              </h3>
              <p className="text-[#c6c6c6] text-[10px] font-mono leading-relaxed uppercase break-words">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── 5. Intercept-Resend Visualizer ───
function InterceptResend() {
  const container = useRef<HTMLDivElement>(null);
  const [basis, setBasis] = useState<"+" | "x">("+");

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container.current,
        start: "top 60%",
      },
      repeat: -1,
      repeatDelay: 2,
    });

    // Reset Sequence
    tl.set(".photon", { x: 0, opacity: 0, scale: 1, filter: "brightness(1) hue-rotate(0deg)" })
      .set(".eve-measure", { opacity: 0, scale: 0.5 })
      .set(".bob-measure", { opacity: 0, scale: 0.5 })
      .set(".qber-alert", { opacity: 0, y: 10 })

      // 1. Photon departs
      .call(() => setBasis("+"))
      .to(".photon", { opacity: 1, duration: 0.2 })

      // 2. Photon travels to Eve
      .to(".photon", { x: "47vw", duration: 2, ease: "power1.inOut" })

      // 3. Eve intercepts in WRONG BASIS (x instead of +)
      .to(".eve-measure", { opacity: 1, scale: 1, duration: 0.3 })
      .to(".photon", {
        filter: "brightness(2) hue-rotate(90deg)", // Visually altering the quantum state
        scale: 1.5,
        rotate: 45,
        duration: 0.3
      })
      .to(".photon", { scale: 1, duration: 0.2 })
      .call(() => setBasis("x")) // State collapsed to new basis
      .to(".eve-measure", { opacity: 0, scale: 0.5, duration: 0.3 }, "+=0.5")

      // 4. Photon travels to Bob
      .to(".photon", { x: "94vw", duration: 2, ease: "power1.inOut" })

      // 5. Bob measures in original + basis
      .to(".bob-measure", { opacity: 1, scale: 1, duration: 0.3 })
      .to(".qber-alert", { opacity: 1, y: 0, duration: 0.3 }) // Discrepancy detected!
      .to(".photon", { opacity: 0, scale: 0, duration: 0.2 }, "+=0.5")
      .to(".qber-alert", { opacity: 0, duration: 0.5 }, "+=1.5")
      .to(".bob-measure", { opacity: 0, duration: 0.5 });

  }, { scope: container });

  return (
    <section id="nodes" ref={container} className="py-20 md:py-28 border-y border-[#474747] overflow-hidden bg-[#0e0e0e] relative grid-mask">
      <div className="px-6 md:px-8 max-w-5xl mx-auto mb-16 text-center">
        <h2 className="font-headline font-black text-2xl md:text-4xl uppercase tight-tracking mb-4">
          Quantum Base Alteration
        </h2>
        <p className="text-[#919191] font-mono text-xs max-w-2xl mx-auto uppercase">
          EVE attempts to intercept the `|+⟩` state. By choosing the wrong measurement basis `|X⟩`, she irreparably collapses the wavefunction. When BOB measures `|+⟩`, the result is randomized, triggering an eavesdropper alert.
        </p>
      </div>

      <div className="relative h-64 w-full flex items-center max-w-5xl mx-auto px-4 font-mono">
        {/* Connection Line */}
        <div className="absolute left-0 right-0 h-[1px] bg-[#474747] z-0 top-1/2 -translate-y-1/2 mx-12 md:mx-16" />

        {/* Alice Node */}
        <div className="z-10 flex flex-col items-center bg-[#000000] px-3 py-2 border border-[#474747]">
          <div className="text-[10px] text-[#FF0000] mb-2 uppercase">A_Node</div>
          <div className="w-12 h-12 border border-white flex items-center justify-center font-headline font-bold text-xl relative">
            A
            <div className="absolute -right-8 bottom-0 text-[10px] text-white">|+⟩</div>
          </div>
        </div>

        {/* Action Canvas */}
        <div className="flex-1 relative h-32 flex items-center overflow-visible">
          {/* Photon */}
          <div className="photon absolute left-0 flex items-center justify-center w-6 h-6 bg-white shadow-[0_0_15px_3px_rgba(255,255,255,0.4)] z-20 rounded-full" style={{ opacity: 0 }}>
            <span className="text-black text-[10px] font-bold">{basis === "+" ? "+" : "x"}</span>
          </div>

          {/* Eve Intercept Point */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
            <div className="eve-measure opacity-0 scale-50 absolute -top-12 text-[#FF0000] border border-[#FF0000] px-2 py-1 text-[10px] whitespace-nowrap bg-black">
              Measure: |X⟩
            </div>
          </div>
        </div>

        {/* Bob Node */}
        <div className="z-10 flex flex-col items-center bg-[#000000] px-3 py-2 border border-[#474747] relative">
          <div className="qber-alert absolute -top-12 text-[#FF0000] font-mono text-[10px] bg-[#FF0000]/10 px-2 py-1 border border-[#FF0000] whitespace-nowrap" style={{ opacity: 0 }}>
            ! STATE COLLAPSE
          </div>
          <div className="text-[10px] text-[#c6c6c6] mb-2 uppercase">B_Node</div>
          <div className="w-12 h-12 border border-[#474747] flex items-center justify-center font-headline font-bold text-xl relative">
            B
            <div className="bob-measure absolute -left-12 bottom-0 text-[10px] text-white bg-black border border-white px-1">Expect: |+⟩</div>
          </div>
        </div>

        {/* Eve Entity */}
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 flex flex-col items-center pb-4">
          <div className="h-10 w-[1px] bg-[#FF0000] border-dashed border-r mb-2" />
          <div className="w-10 h-10 border border-[#FF0000] text-[#FF0000] flex items-center justify-center font-headline font-bold bg-[#0e0e0e] z-30 shadow-[0_0_15px_rgba(255,0,0,0.2)]">
            E
          </div>
          <span className="font-mono text-[9px] mt-2 text-[#FF0000]">EV_INTRUSION</span>
        </div>
      </div>
    </section>
  );
}

// ─── 6. Brute Force Estimator ───
function BruteForce() {
  const container = useRef<HTMLDivElement>(null);
  const [val1, setVal1] = useState(0);
  const [val2, setVal2] = useState(0);

  useGSAP(() => {
    const q = gsap.utils.selector(container);
    const bars = q(".bf-bar");
    const animateBars = () =>
      gsap.to(bars, {
        scaleX: 1,
        duration: 3,
        stagger: 0.3,
        ease: "power3.out",
        overwrite: "auto",
        force3D: true,
      });

    gsap.set(bars, { scaleX: 0, transformOrigin: "left", force3D: true });

    ScrollTrigger.create({
      trigger: container.current,
      start: "top 75%",
      end: "bottom 25%",
      onEnter: () => {
        // Safe animated values using dummy objects to avoid direct DOM manipulation clashes
        const counter = { v1: 0, v2: 0 };
        gsap.to(counter, {
          v1: 3.4,
          duration: 4,
          ease: "power2.out",
          onUpdate: () => setVal1(Number(counter.v1.toFixed(1)))
        });
        gsap.to(counter, {
          v2: 38,
          duration: 5,
          ease: "power3.out",
          onUpdate: () => setVal2(Math.floor(counter.v2))
        });
        animateBars();
      },
      onEnterBack: () => {
        animateBars();
      },
      onLeave: () => {
        gsap.set(bars, { scaleX: 0 });
      },
      onLeaveBack: () => {
        gsap.set(bars, { scaleX: 0 });
      },
    });
  }, { scope: container });

  return (
    <section ref={container} className="py-20 md:py-28 px-6 md:px-8 bg-[#000000] border-b border-[#474747]">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-12 items-center">
        <div className="w-full md:w-1/2">
          <h2 className="font-headline font-black text-2xl md:text-4xl uppercase tight-tracking mb-5">
            Brute Force Resiliency
          </h2>
          <p className="text-[#c6c6c6] font-light leading-relaxed mb-8 text-sm md:text-base">
            Post-quantum cryptography relies on sheer computational complexity. Our AES-256 implementation, seeded by true quantum randomness, exceeds the bounds of classical computing limits.
          </p>
          <div className="p-5 md:p-6 border border-[#FF0000]/30 bg-[#FF0000]/5 relative overflow-hidden">
            <div className="scanlines opacity-50 absolute inset-0 mix-blend-overlay" />
            <span className="font-mono text-[#FF0000] text-[10px] block mb-2">TIME TO CRACK (256-BIT)</span>
            <div className="font-headline font-black text-3xl md:text-5xl text-white counter-animate flex items-baseline gap-1">
              <span>{val1}</span> <span className="text-lg md:text-2xl font-mono">x 10^</span><span>{val2}</span> <span className="text-xl md:text-2xl font-mono ml-2">YRS</span>
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/2 flex flex-col gap-6 font-mono text-[10px] md:text-xs">
          <div>
            <div className="flex justify-between text-[#c6c6c6] mb-2">
              <span>128-BIT AES</span>
              <span>~10^18 YEARS</span>
            </div>
            <div className="w-full bg-[#1b1b1b] h-2 md:h-3">
              <div className="bf-bar bg-[#919191] h-full w-[15%]" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-white mb-2">
              <span>256-BIT QUANTUM SEEDED</span>
              <span className="text-[#FF0000]">~3.4 x 10^38 YEARS</span>
            </div>
            <div className="w-full bg-[#1b1b1b] h-2 md:h-3">
              <div className="bf-bar bg-[#FF0000] h-full w-[95%] shadow-[0_0_10px_0_rgba(255,0,0,0.5)]" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[#474747] mb-2">
              <span>GROVER'S CRYPTANALYSIS (Q-COMP)</span>
              <span>EFFECTIVE 128-BIT</span>
            </div>
            <div className="w-full bg-[#1b1b1b] h-2 md:h-3">
              <div className="bf-bar bg-[#474747] h-full w-[5%]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── 7. Features Section ───
function Features() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".feature-col", {
      scrollTrigger: {
        trigger: container.current,
        start: "top 80%",
      },
      opacity: 0,
      y: 30,
      stagger: 0.15,
      duration: 0.8,
      ease: "power2.out",
    });
  }, { scope: container });

  return (
    <section id="features" ref={container} className="py-20 md:py-28 border-b border-[#474747] bg-[#000000]">
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#474747]">
        <div className="feature-col p-6 md:p-12 flex flex-col gap-6 hover:bg-[#0e0e0e] transition-colors">
          <div className="w-10 h-10 border border-[#FF0000] flex items-center justify-center bg-[#FF0000]/5">
            <ShieldAlert className="h-5 w-5 text-[#FF0000]" />
          </div>
          <h4 className="font-headline font-black text-2xl md:text-3xl uppercase leading-tight tight-tracking text-white">4 QKD Protocols</h4>
          <p className="text-[#c6c6c6] leading-relaxed text-xs md:text-sm">
            Switch between BB84, E91, B92, and SARG04 dynamically based on link atmospheric conditions and distance metrics.
          </p>
        </div>
        <div className="feature-col p-6 md:p-12 flex flex-col gap-6 hover:bg-[#0e0e0e] transition-colors">
          <div className="w-10 h-10 border border-white flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <h4 className="font-headline font-black text-2xl md:text-3xl uppercase leading-tight tight-tracking text-white">Live QBER Monitoring</h4>
          <p className="text-[#c6c6c6] leading-relaxed text-xs md:text-sm">
            Real-time Quantum Bit Error Rate calculation. If noise exceeds 11%, the channel automatically collapses to prevent siphoning.
          </p>
        </div>
        <div className="feature-col p-6 md:p-12 flex flex-col gap-6 hover:bg-[#0e0e0e] transition-colors">
          <div className="w-10 h-10 border border-white flex items-center justify-center">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <h4 className="font-headline font-black text-2xl md:text-3xl uppercase leading-tight tight-tracking text-white">N-Party Groups</h4>
          <p className="text-[#c6c6c6] leading-relaxed text-xs md:text-sm">
            True multi-party entanglement. Secure chats for up to 64 participants with discrete quantum state distribution per node.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── 8. Footer ───
function Footer() {
  return (
    <footer className="bg-black text-[#c6c6c6] font-mono text-[10px] uppercase tracking-widest w-full px-6 md:px-8 py-12 flex flex-col md:flex-row justify-between items-start gap-12 border-[#474747]">
      <div className="flex flex-col gap-3 max-w-sm">
        <div className="text-white font-bold text-xl font-headline">ENTANGL</div>
        <p className="opacity-60 leading-relaxed text-xs lowercase first-letter:uppercase">
          Unconditionally secure communication channels backed by the fundamental laws of quantum mechanics.
        </p>
      </div>
      <div className="flex flex-col gap-2 relative z-20">
        <div className="text-white mb-2 font-bold opacity-50">RESOURCES</div>
        <span className="hover:text-white transition-opacity cursor-pointer">DOCUMENTATION</span>
        <span className="hover:text-white transition-opacity cursor-pointer">API REFERENCE</span>
        <span className="hover:text-white transition-opacity cursor-pointer">SYSTEM STATUS</span>
      </div>
      <div className="flex flex-col gap-2 relative z-20">
        <div className="text-white mb-2 font-bold opacity-50">LEGAL</div>
        <span className="hover:text-white transition-opacity cursor-pointer">PRIVACY POLICY</span>
        <span className="hover:text-white transition-opacity cursor-pointer">TERMS OF SERVICE</span>
      </div>
      <div className="md:text-right flex flex-col justify-end h-full group">
        <p className="opacity-40 mt-8">© 2026 ENTANGL LTD. ALL RIGHTS RESERVED.</p>
      </div>
    </footer>
  );
}

// ─── Main Page ───
export default function LandingPage() {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
    });
    
    // Sync Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);
    
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    
    gsap.ticker.lagSmoothing(0);

    return () => {
      // Cleanup
      lenis.destroy();
      gsap.ticker.remove((time) => {
        lenis.raf(time * 1000);
      });
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#000000] monolith-theme landing-page selection:bg-[#FF0000] selection:text-white">
      <Nav />
      <main className="flex-1 w-full">
        <Hero />
        <QKDProcessTable />
        <HowItWorksGrid />
        <InterceptResend />
        <BruteForce />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
