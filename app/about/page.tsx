import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <Card className="bg-background">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">About U.S. Civics Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="bg-muted p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Disclaimer</h2>
            <p className="text-muted-foreground">
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

          <section>
            <h2 className="text-xl font-semibold mb-3">What is the U.S. Civics Test?</h2>
            <p className="text-muted-foreground">
              The U.S. Civics Test is a crucial component of the naturalization process for immigrants seeking American citizenship. 
              During the naturalization interview, applicants must correctly answer 6 out of 10 civics questions from a pool of 100 questions 
              about American government, history, and integrated civics. The naturalization test is an oral test.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">About This Application</h2>
            <p className="text-muted-foreground">
              This web application is designed to help individuals prepare for the U.S. Citizenship Test by providing:
            </p>
            <ul className="list-disc list-inside mt-2 text-muted-foreground">
              <li>A complete set of all 100 official USCIS civics questions and answers</li>
              <li>Practice tests that simulate the actual citizenship test experience</li>
              <li>Multiple choice and open text answer options for flexible learning</li>
              <li>Immediate feedback and explanations for each answer</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Study Resources</h2>
            <p className="text-muted-foreground">
              For official study materials and additional information, visit:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-2 text-muted-foreground">
              <li>
                <a 
                  href="https://www.uscis.gov/citizenship" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  USCIS Citizenship Resource Center
                </a>
              </li>
              <li>
                <a 
                  href="https://www.uscis.gov/sites/default/files/document/questions-and-answers/100q.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Official USCIS 100 Questions and Answers (PDF)
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Feedback & Updates</h2>
            <p className="text-muted-foreground">
              For issues, suggestions, or updates, you can:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-2 text-muted-foreground">
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

          <section>
            <h2 className="text-xl font-semibold mb-3">Open Source</h2>
            <p className="text-muted-foreground">
              This project is open source and available on GitHub. Contributions are welcome! Visit our 
              <a 
                href="https://github.com/ardasisbot/civics-test" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline ml-1"
              >
                GitHub repository
              </a> 
              to learn more about how you can contribute to improving this educational resource.
            </p>
          </section>
        </CardContent>
      </Card>
    </main>
  )
} 