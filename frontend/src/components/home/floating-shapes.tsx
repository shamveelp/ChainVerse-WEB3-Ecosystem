const shapes = [
  {
    id: 1,
    size: "w-72 h-72",
    position: "top-20 left-10",
    gradient: "from-[#ff4ecd] to-[#7aebfb]", // neon pink to cyan
  },
  {
    id: 2,
    size: "w-96 h-96",
    position: "top-1/3 right-10",
    gradient: "from-[#ff6a00] to-[#ee0979]", // orange to rose
  },
  {
    id: 3,
    size: "w-64 h-64",
    position: "bottom-20 left-1/4",
    gradient: "from-[#8e2de2] to-[#4a00e0]", // electric purple
  },
  {
    id: 4,
    size: "w-80 h-80",
    position: "bottom-1/3 right-1/4",
    gradient: "from-[#00c9ff] to-[#92fe9d]", // sky blue to lime green
  },
  {
    id: 5,
    size: "w-60 h-60",
    position: "top-10 right-1/3",
    gradient: "from-[#ff9a9e] to-[#fad0c4]", // soft pink to peach
  },
  {
    id: 6,
    size: "w-72 h-72",
    position: "bottom-10 left-10",
    gradient: "from-[#fdfbfb] to-[#ebedee]", // light gray glassy
  },
  {
    id: 7,
    size: "w-64 h-64",
    position: "top-1/2 left-1/2",
    gradient: "from-[#00F260] to-[#0575E6]", // green to deep blue
  },
  {
    id: 8,
    size: "w-80 h-80",
    position: "bottom-0 right-0",
    gradient: "from-[#F7971E] to-[#FFD200]", // orange to yellow
  },
  {
    id: 9,
    size: "w-56 h-56",
    position: "top-32 left-1/3",
    gradient: "from-[#e1eec3] to-[#f05053]", // lime to red-orange
  },
  {
    id: 10,
    size: "w-96 h-96",
    position: "bottom-1/4 right-16",
    gradient: "from-[#43e97b] to-[#38f9d7]", // mint to teal
  },
  {
    id: 11,
    size: "w-72 h-72",
    position: "top-0 left-1/5",
    gradient: "from-[#fc466b] to-[#3f5efb]", // pink to indigo
  },
  {
    id: 12,
    size: "w-60 h-60",
    position: "bottom-10 left-1/2",
    gradient: "from-[#f953c6] to-[#b91d73]", // hot pink to purple
  },
]

export default function FloatingShapes() {
  return (
    <>
      {shapes.map((shape) => (
        <div
          key={shape.id}
          className={`absolute ${shape.size} rounded-full mix-blend-screen filter blur-3xl opacity-70 animate-blob ${shape.position} bg-gradient-to-br ${shape.gradient}`}
          style={{ animationDelay: `${shape.id * 0.5}s` }}
        />
      ))}
    </>
  )
}
