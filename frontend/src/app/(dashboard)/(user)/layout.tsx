import { ThemeProvider } from "@/components/theme-provider"

export default function GenericUserLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            forcedTheme="dark"
            disableTransitionOnChange
        >
            {children}
        </ThemeProvider>
    )
}
