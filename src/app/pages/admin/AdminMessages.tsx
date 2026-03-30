import { useState, useEffect } from "react";
import { Mail, Search, Trash2, Eye, Check, CheckCheck, Clock, User, Phone, MessageSquare } from "lucide-react";
import { useAdmin } from "../../context/AdminContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

export default function AdminMessages() {
  const { 
    messages, 
    markMessageAsRead, 
    markMessageAsReplied, 
    markAllMessagesAsRead, 
    deleteMessage 
  } = useAdmin();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingMessage, setViewingMessage] = useState<string | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const safeMessages = messages || [];

  const filteredMessages = safeMessages.filter((m) => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const currentMessage = safeMessages.find((m) => m.id === viewingMessage);

  const newCount = safeMessages.filter(m => m.status === "new").length;
  const readCount = safeMessages.filter(m => m.status === "read").length;
  const repliedCount = safeMessages.filter(m => m.status === "replied").length;

  const handleViewMessage = (messageId: string, status: string) => {
    setViewingMessage(messageId);
    if (status === "new") {
      markMessageAsRead(messageId);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    deleteMessage(messageId);
    setDeletingMessage(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
            New
          </span>
        );
      case "read":
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
            Read
          </span>
        );
      case "replied":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
            Replied
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Messages</h1>
          <p className="text-gray-600">Manage customer contact submissions</p>
        </div>
        <div className="flex gap-4 flex-wrap">
          <div className="text-center px-3 py-1 bg-red-100 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{newCount}</p>
            <p className="text-xs text-red-600">New</p>
          </div>
          <div className="text-center px-3 py-1 bg-blue-100 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{readCount}</p>
            <p className="text-xs text-blue-600">Read</p>
          </div>
          <div className="text-center px-3 py-1 bg-green-100 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{repliedCount}</p>
            <p className="text-xs text-green-600">Replied</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by name, email, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="all">All Messages</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
          </select>
          {newCount > 0 && (
            <Button
              onClick={markAllMessagesAsRead}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {filteredMessages.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Mail className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {searchQuery || statusFilter !== "all" 
              ? "No messages found" 
              : "No messages yet"}
          </h3>
          <p className="text-gray-500">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filter"
              : "Customer messages will appear here when submitted"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Subject</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Message Preview</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Date</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMessages.map((message) => (
                  <tr 
                    key={message.id} 
                    className={`hover:bg-gray-50 transition-colors ${message.status === "new" ? "bg-red-50/30" : ""}`}
                  >
                    <td className="px-6 py-4">
                      {getStatusBadge(message.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center">
                          <span className="text-black font-bold text-sm">
                            {message.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{message.name}</p>
                          <p className="text-sm text-gray-500">{message.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">
                        {message.subject || <span className="text-gray-400 italic">No subject</span>}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600 truncate max-w-xs">
                        {message.message}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {formatDate(message.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewMessage(message.id, message.status)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingMessage(message.id);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Message Dialog */}
      <Dialog open={!!viewingMessage} onOpenChange={() => setViewingMessage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Message Details</DialogTitle>
          </DialogHeader>
          {currentMessage && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                {getStatusBadge(currentMessage.status)}
                <span className="text-sm text-gray-500">
                  {formatDate(currentMessage.createdAt)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-[#D4AF37]" />
                  <div>
                    <p className="text-sm text-gray-500">Customer Name</p>
                    <p className="font-medium">{currentMessage.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-[#D4AF37]" />
                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <a href={`mailto:${currentMessage.email}`} className="font-medium text-blue-600 hover:underline">
                      {currentMessage.email}
                    </a>
                  </div>
                </div>
                {currentMessage.phone && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-[#D4AF37]" />
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <a href={`tel:${currentMessage.phone}`} className="font-medium text-blue-600 hover:underline">
                        {currentMessage.phone}
                      </a>
                    </div>
                  </div>
                )}
                {currentMessage.subject && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-[#D4AF37]" />
                    <div>
                      <p className="text-sm text-gray-500">Subject</p>
                      <p className="font-medium">{currentMessage.subject}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-sm text-gray-500 mb-2 font-medium">Message</h3>
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {currentMessage.message}
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                {currentMessage.status === "new" && (
                  <Button
                    onClick={() => markMessageAsRead(currentMessage.id)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Mark as Read
                  </Button>
                )}
                {currentMessage.status !== "replied" && (
                  <Button
                    onClick={() => {
                      markMessageAsReplied(currentMessage.id);
                      window.open(`mailto:${currentMessage.email}?subject=Re: ${currentMessage.subject || "Contact Form Message"}`, "_blank");
                    }}
                    className="bg-[#D4AF37] hover:bg-[#b8962f] text-black flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Mark as Replied
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setViewingMessage(null);
                    setDeletingMessage(currentMessage.id);
                  }}
                  variant="outline"
                  className="text-red-600 hover:bg-red-50 flex items-center gap-2 ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingMessage} onOpenChange={() => setDeletingMessage(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Delete Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeletingMessage(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDeleteMessage(deletingMessage!)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
