import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { Trash2, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getChats, updateChat, deleteChat, Chat } from "@/api/client";
import { useUser } from "@clerk/nextjs";
import { useLoadingNavigation } from "@/hooks/use-loading-navigation";

export const TrashDialog: React.FC<{ 
  onAction?: () => void; 
  onChatChange?: () => void; 
  isCollapsed?: boolean 
}> = ({ onAction, onChatChange, isCollapsed }) => {
  const [open, setOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { user } = useUser();
  const { navigateWithLoading } = useLoadingNavigation();
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !user?.id) return;
    getChats(user.id, true).then(res => setChats(res.filter(c => c.is_archived)));
  }, [open, user]);

  const filtered = chats.filter(chat => chat.title.toLowerCase().includes(search.toLowerCase()));

  const handleRestore = async (id: number) => {
    await updateChat(id, undefined, false);
    setChats(chats => chats.filter(c => c.id !== id));
    toast({ title: "The chat has been moved out of trash." });
    if (onAction) onAction();
    if (onChatChange) onChatChange();
    navigateWithLoading("/dashboard/chat/" + id);
  };

  const handleDelete = async (id: number) => {
    await deleteChat(id);
    setChats(chats => chats.filter(c => c.id !== id));
    toast({ title: "Chat deleted. The chat has been permanently deleted." });
    setDeleteId(null);
    if (onAction) onAction();
    if (onChatChange) onChatChange();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={`group flex items-center ${isCollapsed ? "justify-center" : ""} gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:scale-105 relative text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full cursor-pointer`}>
          <Trash2 className="h-5 w-5" />
          {!isCollapsed && <span>Trash</span>}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg w-full rounded-lg border">
        <DialogHeader>
          <DialogTitle>Trash</DialogTitle>
        </DialogHeader>
        <SearchBar value={search} onChange={setSearch} placeholder="Search in trash..." className="mb-4" />
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">No archived chats.</div>
          ) : (
            filtered.map(chat => (
              <div key={chat.id} className="flex items-center justify-between bg-secondary rounded px-3 py-2">
                <div className="truncate flex-1">{chat.title}</div>
                <div className="flex items-center gap-2 ml-2">
                  <Button size="icon" variant="ghost" onClick={() => handleRestore(chat.id)} title="Restore" className="cursor-pointer">
                    <RotateCcw className="h-4 w-4 text-primary" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteId(chat.id)} title="Delete permanently" className="cursor-pointer">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <div>This will permanently delete the chat and cannot be undone.</div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} className="bg-destructive text-destructive-foreground cursor-pointer">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}; 