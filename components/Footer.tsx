export default function Footer() {
  return (
    <footer className="border-grid border-t py-6 md:py-0">
      <div className="container-wrapper">
        <div className="container py-4">
          <div className="flex flex-col gap-2 text-center text-sm text-muted-foreground md:text-left">
            <p className="text-left leading-loose">
              Built by{" "}
              <a
                href={'https://x.com/asisbot'}
                target="_blank"
                rel="noreferrer"
                className="font-medium underline underline-offset-4"
              >
                @asisbot
              </a>
              . The source code is available on{" "}
              <a
                href={'https://github.com/ardasisbot/civics-test'}
                target="_blank"
                rel="noreferrer"
                className="font-medium underline underline-offset-4"
              >
                GitHub
              </a>
              .
            </p>
            <p className="text-left text-xs">
              This is not an official USCIS application. Use at your own risk. 
              For issues or updates, DM{" "}
              <a
                href={'https://x.com/asisbot'}
                target="_blank"
                rel="noreferrer"
                className="font-medium "
              >
                @asisbot
              </a>
              {" "}or file an issue on GitHub.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
} 