import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MessageSquare, RefreshCcw, AlertCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Skeleton } from "@/components/ui/skeleton";
import * as api from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<api.MessageResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
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

  const handleDelete = async (id: number) => {
    try {
      await api.deleteMessage(id);
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
      toast({
        title: "Message deleted",
        description: "Message was successfully deleted",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error deleting message",
        description:
          err instanceof Error ? err.message : "Failed to delete message",
      });
    } finally {
      setMessageToDelete(null);
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">Message History</h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={fetchMessages}
                    disabled={refreshing}
                    className="h-8 w-8"
                  >
                    <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                {refreshing ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  ))
                ) : messages.length > 0 ? (
                  messages.map((msg) => (
                    <Alert key={msg.id} variant="default" className="bg-white/50 backdrop-blur-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            <AlertTitle className="text-sm font-medium">
                              Message {msg.id} • {new Date(msg.createdAt).toLocaleTimeString()}
                            </AlertTitle>
                          </div>
                          <AlertDescription className="mt-2 space-y-1 text-sm">
                            <p className="text-muted-foreground">{msg.content}</p>
                          </AlertDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setMessageToDelete(msg.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Alert>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No messages yet. Send one to get started!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={messageToDelete !== null} onOpenChange={() => setMessageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => messageToDelete && handleDelete(messageToDelete)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster />
    </>
  );
}

export default App;
