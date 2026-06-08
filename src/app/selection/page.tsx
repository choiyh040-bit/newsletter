"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const THEMES = [
  {
    id: "Calm Business",
    label: "Calm Business",
    desc: "차분하고 전문적인 분위기를 자아내는 비즈니스 최적화 테마입니다.",
    hover: "신뢰감 있고 정돈된 스타일",
    imgSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC_GkuDeTCGVFOAOu17STba24icF7EvsZ2qj9QWTHEOWtjW1elObqeJ9tg4t0WgZem74z7WecE6zj3zgtHLoFg7el6_vthKhWh8vMYgAQq-VqZ9EB4_Dlh6g46A7Lt9uklCP_kNEpj1ERZZYWKEbpcqr_ZlzkzyVLnaixCzI15lzMLl_dS5LXekGCpKRPQZ-eZanLdbITAuCuFnfoQXhW0r9Qq918VNGN2yM6OtsHxFjs8zuTh7rFdNHx1dAZDlz4smwhrzOnnn2yN4",
  },
  {
    id: "Vibrant Casual",
    label: "Vibrant Casual",
    desc: "개성 넘치고 소통 중심적인 SNS와 블로그에 어울리는 생동감 넘치는 테마입니다.",
    hover: "활기차고 트렌디한 스타일",
    imgSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAm0H5SX0TUuF2lJMBRtwsoe7ZycC1ev0AUHOMml22h0v3RQ6GgodGUPWTTfg8eV_-0t6rQcyUIczRc59e7YfP5syS4-lpiWWSpLZyMrTG6i4a_uYj1NAlycpVuUVmbIQ64xFuBmBKGzuzaZsffC2tBHqEZK9fduAUzOpAfI_2LsFCQsyyRJeiYz5ht3IXLKQdZNfHIv0sdIP4d-8kSQOmd-nrII3cDEHwscK4GmIb_6KO6VK8P-xnx_WRE-LG0tfUvx3NXk8N8H2QN",
  },
  {
    id: "Informative",
    label: "Informative",
    desc: "많은 정보를 깔끔한 그리드와 폰트 가독성으로 해결한 정보성 뉴스레터 테마입니다.",
    hover: "정보 전달에 집중한 스타일",
    imgSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA0ElCGc6vS0vPUSeNGP9ldfhbO67xCiJqIHWJ_tNp4ioHdq97SmV2lZwE5Yj0tAR8WL7Nx2YmcRfcaqiJBR9zBc-2rCF17-Se58l1b1g9sqckbu632r-605ZC4bG_pfQd3eVEZwjO3fQLN5RikWs9CD_2PWZCyYTzJvHe6HB2pNp3wpGPaikSG3223-a1IcDnt1J92vDQS16N6cL7yL1Hot6_RevgjTwI5UKn7RJqsR8vbJkWPEW6OXdMlkSx9H3bPc7lup0_Kk",
  },
  {
    id: "Modern Minimal",
    label: "Modern Minimal",
    desc: "여백의 미를 극대화하여 핵심 메시지에만 집중하게 만드는 세련된 테마입니다.",
    hover: "심플하고 세련된 미니멀리즘",
    imgSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD8voJ07ThL4SWDIhaKunN7A9QtLHyWchxPKJzrycVp92AaEe8a6nIzcALt1ozIiUDyebg6R2Hce3kQYginI_3bBNBEEO7e_NNDe7RwkBkh85RbWxqnV9chjxwx7BNqSpKIWlxThfzrKdYsYXC1kFzUdoLMZMC_hBr6QdjYcWNBG1-uFtlchtqNAqiG1z4hAOPdaDA6NSYeasYRsZv4QowydeI3_9GFm822bB8X4XqrC_rimxjPqaNWEyTHwc_dnuwex6fSUTzhB376",
  },
];

function SelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword") ?? "";
  const platform = searchParams.get("platform") ?? "Instagram";

  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  const handleNext = () => {
    if (!selectedTheme) return;
    const params = new URLSearchParams({ keyword, platform, theme: selectedTheme });
    router.push(`/loading?${params.toString()}`);
  };

  return (
    <>
      {/* Top Navigation */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-lg border-b border-outline-variant/30 shadow-sm">
        <nav className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary-container text-headline-md">
              smart_toy
            </span>
            <span className="font-hangame text-headline-md font-bold text-primary-container tracking-tight">
              SNS NewsGen
            </span>
          </div>
          <div className="hidden md:flex gap-md">
            <a className="font-label-md text-label-md text-primary-container font-bold" href="/">Templates</a>
            <a className="font-label-md text-label-md text-on-surface-variant font-medium hover:text-primary-container transition-colors" href="#">Workspace</a>
            <a className="font-label-md text-label-md text-on-surface-variant font-medium hover:text-primary-container transition-colors" href="#">Analytics</a>
          </div>
          <button className="active:scale-95 transition-transform bg-primary-container text-white px-md py-base rounded-lg font-label-md text-label-md">
            Get Started
          </button>
        </nav>
      </header>

      <main className="pt-24 pb-xl px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto min-h-screen flex flex-col items-center">
        {/* Page Title */}
        <section className="w-full text-center mb-lg">
          <h1 className="font-hangame text-[32px] md:text-display-lg font-bold text-white mb-xs">
            어떤 스타일로 만들까요?
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">
            AI가 생성할 뉴스레터와 소셜 콘텐츠의 <br />
            시각적 톤앤매너를 선택하세요. 선택한 테마에 맞춰 <br />
            디자인이 자동으로 구성됩니다.
          </p>
          {keyword && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-primary font-label-md text-label-sm">
              <span className="material-symbols-outlined text-[16px]">search</span>
              <span className="font-korean-reg text-white/80">
                키워드: <span className="text-primary font-bold">{keyword}</span>
                <span className="ml-2 text-white/50">· {platform}</span>
              </span>
            </div>
          )}
        </section>

        {/* Template Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter w-full mb-xl">
          {THEMES.map((theme) => {
            const isActive = selectedTheme === theme.id;
            return (
              <div
                key={theme.id}
                id={`theme-${theme.id.toLowerCase().replace(/\s/g, "-")}`}
                onClick={() => setSelectedTheme(theme.id)}
                className={`group relative flex flex-col glass-panel rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:translate-y-[-4px] active:scale-[0.98] ${
                  isActive ? "border-primary-container bg-surface-container-high/50" : ""
                }`}
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-surface-container-high relative">
                  <img className="w-full h-full object-cover" src={theme.imgSrc} alt={theme.label} />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-sm">
                    <span className="text-white font-label-sm text-label-sm">{theme.hover}</span>
                  </div>
                </div>
                <div className="p-md flex flex-col flex-grow">
                  <h3 className="font-hangame text-headline-md font-bold text-white mb-xs">{theme.label}</h3>
                  <p className="font-hangame text-label-md font-normal text-white mb-md leading-relaxed">{theme.desc}</p>
                  <div className="mt-auto">
                    <button
                      className={`w-full py-xs border rounded-lg text-white font-label-md transition-all ${
                        isActive
                          ? "bg-primary-container border-primary-container"
                          : "border-outline-variant group-hover:bg-primary-container group-hover:border-primary-container"
                      }`}
                    >
                      {isActive ? "선택됨" : "선택하기"}
                    </button>
                  </div>
                </div>
                {/* Selection Marker */}
                <div
                  className={`absolute top-4 right-4 w-6 h-6 rounded-full bg-primary-container flex items-center justify-center transition-opacity duration-300 shadow-lg ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <span className="material-symbols-outlined text-white text-[16px] font-bold">check</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center gap-sm mb-lg">
          <div className="w-12 h-1 bg-primary-container rounded-full"></div>
          <div className="w-12 h-1 bg-surface-container-highest rounded-full"></div>
          <div className="w-12 h-1 bg-surface-container-highest rounded-full"></div>
        </div>

        {/* Next Button */}
        <div className="w-full max-w-md">
          <button
            id="next-button"
            onClick={handleNext}
            disabled={!selectedTheme}
            className="w-full py-md bg-primary-container text-white font-hangame text-headline-md font-bold rounded-xl shadow-lg transition-all duration-300 hover:shadow-primary-container/20 active:scale-95 flex items-center justify-center gap-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음 단계로 이동
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <p className="text-center mt-sm font-label-sm text-label-sm text-on-surface-variant">
            선택한 스타일은 생성 후에도 편집기에서 수정이 가능합니다.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-lg bg-surface-container-lowest border-t border-outline-variant/10">
        <div className="flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop gap-md max-w-7xl mx-auto">
          <div className="flex flex-col gap-xs items-center md:items-start">
            <span className="font-hangame text-headline-sm font-black text-white">SNS NewsGen</span>
            <p className="font-label-sm text-label-sm text-primary-container">
              © 2024 SNS Newsletter Generator. AI-Powered Creativity.
            </p>
          </div>
          <div className="flex gap-md flex-wrap justify-center">
            <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary-container transition-colors cursor-pointer" href="#">Privacy Policy</a>
            <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary-container transition-colors cursor-pointer" href="#">Terms of Service</a>
            <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary-container transition-colors cursor-pointer" href="#">API Status</a>
            <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary-container transition-colors cursor-pointer" href="#">Contact Support</a>
          </div>
        </div>
      </footer>
    </>
  );
}

export default function SelectionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">로딩 중...</div>}>
      <SelectionContent />
    </Suspense>
  );
}
