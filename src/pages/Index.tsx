import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, CheckCircle2 } from "lucide-react";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/$/, "");

const Index = () => {
  const [username, setUsername] = useState("");
  const [solved, setSolved] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cardUrl, setCardUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateCard = async () => {
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a HackerRank username",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const endpointBase = API_BASE_URL ? `${API_BASE_URL}/api/hackerrank-card` : "/api/hackerrank-card";
    let requestUrl = `${endpointBase}?username=${encodeURIComponent(username)}`;
    
    // Add solved parameter if provided
    if (solved.trim()) {
      const solvedNum = parseInt(solved, 10);
      if (!isNaN(solvedNum) && solvedNum > 0) {
        requestUrl += `&solved=${solvedNum}`;
      }
    }
    
    // Test if the card can be generated
    try {
      const response = await fetch(requestUrl);
      if (!response.ok) {
        throw new Error("Failed to generate card");
      }
      const absoluteUrl = API_BASE_URL
        ? requestUrl
        : `${typeof window !== "undefined" ? window.location.origin : ""}${requestUrl}`;
      setCardUrl(absoluteUrl);
      toast({
        title: "Success!",
        description: "Your HackerRank stats card is ready",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate card. Please check the username.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;

    const copy = async () => {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
    };

    copy();
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Embed code copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const markdownCode = cardUrl ? `![HackerRank Stats](${cardUrl})` : "";
  const htmlCode = cardUrl ? `<img src="${cardUrl}" alt="HackerRank Stats" />` : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">HR</span>
            </div>
            <h1 className="text-2xl font-bold">HackerRank Stats Card</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Generate Your HackerRank Stats Card
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create a beautiful SVG card showcasing your HackerRank achievements. Perfect for GitHub profiles, portfolios, and more.
          </p>
        </div>

        {/* Input Section */}
        <Card className="p-8 mb-8 border-2">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Enter HackerRank username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generateCard()}
                className="flex-1 h-12 text-lg"
              />
              <Input
                placeholder="Problems solved (optional)"
                value={solved}
                onChange={(e) => setSolved(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generateCard()}
                type="number"
                min="0"
                className="sm:w-48 h-12 text-lg"
              />
              <Button
                onClick={generateCard}
                disabled={isLoading}
                size="lg"
                className="h-12 px-8 bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Card"
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Add your total problems solved count for a complete stats display.
            </p>
          </div>
        </Card>

        {/* Preview Section */}
        {cardUrl && (
          <div className="space-y-6">
            <Card className="p-8 border-2">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Preview
              </h3>
              <div className="bg-muted rounded-lg p-6 flex items-center justify-center">
                <img src={cardUrl} alt="HackerRank Stats" className="max-w-full h-auto" />
              </div>
            </Card>

            {/* Embed Codes */}
            <Card className="p-8 border-2">
              <h3 className="text-xl font-semibold mb-6">Embed Code</h3>
              
              <div className="space-y-4">
                {/* Markdown */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-muted-foreground">Markdown</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(markdownCode)}
                      className="h-8"
                    >
                      {copied ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <code className="block w-full p-3 bg-muted rounded-lg text-sm font-mono break-all">
                    {markdownCode}
                  </code>
                </div>

                {/* HTML */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-muted-foreground">HTML</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(htmlCode)}
                      className="h-8"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <code className="block w-full p-3 bg-muted rounded-lg text-sm font-mono break-all">
                    {htmlCode}
                  </code>
                </div>

                {/* Direct URL */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-muted-foreground">Direct URL</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(cardUrl)}
                      className="h-8"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <code className="block w-full p-3 bg-muted rounded-lg text-sm font-mono break-all">
                    {cardUrl}
                  </code>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-semibold">BZ</span>
            </div>
            <h3 className="font-semibold mb-2">Badges & Achievements</h3>
            <p className="text-sm text-muted-foreground">
              Display your gold, silver, and bronze badges
            </p>
          </Card>
          
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-semibold">CT</span>
            </div>
            <h3 className="font-semibold mb-2">Certificates</h3>
            <p className="text-sm text-muted-foreground">
              Show off your verified certifications
            </p>
          </Card>
          
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-semibold">RT</span>
            </div>
            <h3 className="font-semibold mb-2">Real-time Updates</h3>
            <p className="text-sm text-muted-foreground">
              Card updates automatically with your profile
            </p>
          </Card>
        </div>
      </main>

      {/* Footer */}
            {/* Footer */}
      <footer className="border-t border-border/40 mt-16">
        <div className="container mx-auto px-4 py-6 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-center md:text-left">
            Built by{" "}
            <a
              href="https://shaonresume.netlify.app"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-foreground hover:underline"
            >
              Shaon Majumder
            </a>{" "}
            — Senior Software Engineer (AI &amp; Scalability)
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-4">
            <a
              href="https://www.linkedin.com/in/shaonmajumder"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground hover:underline"
            >
              LinkedIn
            </a>
            <a
              href="https://github.com/ShaonMajumder"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground hover:underline"
            >
              GitHub
            </a>
            <a
              href="https://medium.com/@shaonmajumder"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground hover:underline"
            >
              Medium
            </a>
            <a
              href="https://shaonresume.netlify.app"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground hover:underline"
            >
              Portfolio
            </a>
            <a
              href="https://docs.google.com/document/d/1frKGGkaE1nG9G8mTkxUoPfcU0jppSZYOy4VMPTlIb-Y/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground hover:underline"
            >
              Resume
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
