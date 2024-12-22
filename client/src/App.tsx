import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MessageSquare, RefreshCcw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Skeleton } from "@/components/ui/skeleton";
import * as api from "@/lib/api";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<api.MessageResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchMessages = async () => {
    try {
      setRefreshing(true);
      const data = await api.getMessages();
      setMessages(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch messages");
      toast({
        variant: "destructive",
        title: "Error fetching messages",
        description:
          err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const sendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    try {
      const data = await api.sendMessage(message);
      setMessages((prev) => [data, ...prev]);
      setMessage("");
      setError(null);
      toast({
        title: "Message sent",
        description: "Your message was successfully sent to the server",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      toast({
        variant: "destructive",
        title: "Error sending message",
        description:
          err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Message Exchange Demo</CardTitle>
              <CardDescription>
                Send a message to the server and see the response
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <Button onClick={sendMessage} disabled={loading}>
                  {loading ? "Sending..." : "Send"}
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Message History</CardTitle>
                <CardDescription>
                  Recent messages exchanged with the server
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchMessages}
                disabled={refreshing}
              >
                <RefreshCcw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {refreshing ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))
              ) : messages.length > 0 ? (
                messages.map((msg) => (
                  <Alert key={msg.id}>
                    <MessageSquare className="h-4 w-4" />
                    <AlertTitle>
                      Message {new Date(msg.timestamp).toLocaleTimeString()}
                    </AlertTitle>
                    <AlertDescription className="mt-2 space-y-2">
                      <p>
                        <strong>Sent:</strong> {msg.received}
                      </p>
                      <p>
                        <strong>Response:</strong> {msg.serverResponse}
                      </p>
                    </AlertDescription>
                  </Alert>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No messages yet. Start the conversation!
                </div>
              )}
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              Messages are processed through the Express server
            </CardFooter>
          </Card>
        </div>
      </div>
      <Toaster />
    </>
  );
}

export default App;
