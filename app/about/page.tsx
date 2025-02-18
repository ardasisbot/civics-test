import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-12 px-3 sm:px-4 lg:px-6 max-w-5xl mb-3 mx-auto">
      <Card className=" border-none shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">About U.S. Civics Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <section className="bg-muted/50 p-5 rounded-xl backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-3 tracking-tight">Disclaimer</h2>
            <p className="text-muted-foreground leading-7 [&:not(:first-child)]:mt-6">
              This is not an official USCIS application. This tool is designed for practice purposes only 
              and should be used at your own risk. For official test preparation, please visit the 
              <a 
                href="https://www.uscis.gov/citizenship" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline mx-1"
              >
                official USCIS website
              </a>.
            </p>
          </section>

          <section className="group hover:bg-muted/20 p-3 rounded-lg transition-all duration-300">
            <h2 className="text-2xl font-semibold mb-4 tracking-tight">What is the U.S. Civics Test?</h2>
            <p className="text-muted-foreground leading-relaxed">
              The U.S. Civics Test is a crucial component of the naturalization process for immigrants seeking American citizenship. 
              During the naturalization interview, applicants must correctly answer 6 out of 10 civics questions from a pool of 100 questions 
              about American government, history, and integrated civics. The naturalization test is an oral test.
            </p>
          </section>

          <section className="group hover:bg-muted/20 p-3 rounded-lg transition-all duration-300">
            <h2 className="text-2xl font-semibold mb-4 tracking-tight">About This Application</h2>
            <p className="text-muted-foreground">
              This web application is designed to help individuals prepare for the U.S. Citizenship Test by providing:
            </p>
            <ul className="list-disc list-inside mt-4 text-muted-foreground space-y-2 ml-2">
              <li>A complete set of all 100 official USCIS civics questions and answers</li>
              <li>Practice tests that simulate the actual citizenship test experience</li>
              <li>Multiple choice and open text answer options for flexible learning</li>
              <li>Immediate feedback and explanations for each answer</li>
            </ul>
          </section>

          <section className="group hover:bg-muted/20 p-3 rounded-lg transition-all duration-300">
            <h2 className="text-2xl font-semibold mb-4 tracking-tight">Feedback & Updates</h2>
            <p className="text-muted-foreground">
              For issues, suggestions, or updates, you can:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-3 text-muted-foreground ml-2">
              <li>
                DM me on Twitter at{" "}
                <a 
                  href="https://x.com/asisbot" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  @asisbot
                </a>
              </li>
              <li>
                Create an issue or comment on{" "}
                <a 
                  href="https://github.com/ardasisbot/civics-test" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </section>

          <section className="group hover:bg-muted/20 p-3 rounded-lg transition-all duration-300">
            <h2 className="text-2xl font-semibold mb-4 tracking-tight">Open Source</h2>
            <p className="text-muted-foreground leading-relaxed">
              This project is open source and available on GitHub. Contributions are welcome! Visit our 
              <a 
                href="https://github.com/ardasisbot/civics-test" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline ml-1"
              >
                GitHub repo
              </a> 
             {' ' }to learn more about how you can contribute to improving this educational resource.
            </p>
          </section>
        </CardContent>
      </Card>
    </main>
  )
} 