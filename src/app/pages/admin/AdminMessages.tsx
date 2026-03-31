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
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-12 text-center">
          <Mail className="w-10 h-10 md:w-16 md:h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-2">
            {searchQuery || statusFilter !== "all" 
              ? "No messages found" 
              : "No messages yet"}
          </h3>
          <p className="text-gray-500 text-sm md:text-base">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filter"
              : "Customer messages will appear here when submitted"}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
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

          <div className="md:hidden space-y-3">
            {filteredMessages.map((message) => (
              <div 
                key={message.id}
                className={`bg-white rounded-lg shadow-sm p-4 ${message.status === "new" ? "border-l-4 border-red-500" : ""}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#D4AF37] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-black font-bold">
                        {message.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{message.name}</p>
                      <p className="text-sm text-gray-500 truncate">{message.email}</p>
                    </div>
                  </div>
                  {getStatusBadge(message.status)}
                </div>
                
                <div className="mb-3">
                  <p className="text-sm text-gray-500 mb-1">Subject:</p>
                  <p className="text-gray-900 text-sm truncate">
                    {message.subject || <span className="text-gray-400 italic">No subject</span>}
                  </p>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm text-gray-500 mb-1">Message:</p>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {message.message}
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatDate(message.createdAt)}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewMessage(message.id, message.status)}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8 px-2"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      <span className="text-xs">View</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingMessage(message.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50 h-8 px-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* View Message Dialog */}
      <Dialog open={!!viewingMessage} onOpenChange={() => setViewingMessage(null)}>
        <DialogContent className="max-w-full md:max-w-2xl max-h-[90vh] overflow-y-auto mx-4 md:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl font-bold pr-8">Message Details</DialogTitle>
          </DialogHeader>
          {currentMessage && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {getStatusBadge(currentMessage.status)}
                <span className="text-xs md:text-sm text-gray-500">
                  {formatDate(currentMessage.createdAt)}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 p-3 md:p-4 bg-gray-50 rounded-lg">
                  <User className="w-4 h-4 md:w-5 md:h-5 text-[#D4AF37] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-gray-500">Customer Name</p>
                    <p className="font-medium text-sm md:text-base truncate">{currentMessage.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 md:p-4 bg-gray-50 rounded-lg">
                  <Mail className="w-4 h-4 md:w-5 md:h-5 text-[#D4AF37] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-gray-500">Email Address</p>
                    <a href={`mailto:${currentMessage.email}`} className="font-medium text-blue-600 hover:underline text-sm md:text-base break-all">
                      {currentMessage.email}
                    </a>
                  </div>
                </div>
                {currentMessage.phone && (
                  <div className="flex items-center gap-3 p-3 md:p-4 bg-gray-50 rounded-lg">
                    <Phone className="w-4 h-4 md:w-5 md:h-5 text-[#D4AF37] flex-shrink-0" />
                    <div>
                      <p className="text-xs md:text-sm text-gray-500">Phone Number</p>
                      <a href={`tel:${currentMessage.phone}`} className="font-medium text-blue-600 hover:underline text-sm md:text-base">
                        {currentMessage.phone}
                      </a>
                    </div>
                  </div>
                )}
                {currentMessage.subject && (
                  <div className="flex items-center gap-3 p-3 md:p-4 bg-gray-50 rounded-lg">
                    <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-[#D4AF37] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm text-gray-500">Subject</p>
                      <p className="font-medium text-sm md:text-base truncate">{currentMessage.subject}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 md:p-6">
                <h3 className="text-xs md:text-sm text-gray-500 mb-2 font-medium">Message</h3>
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                  {currentMessage.message}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 md:pt-4 border-t">
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  {currentMessage.status === "new" && (
                    <Button
                      onClick={() => markMessageAsRead(currentMessage.id)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 flex-1 sm:flex-none justify-center"
                    >
                      <Check className="w-4 h-4" />
                      <span className="hidden sm:inline">Mark as Read</span>
                      <span className="sm:hidden">Read</span>
                    </Button>
                  )}
                  {currentMessage.status !== "replied" && (
                    <Button
                      onClick={() => {
                        markMessageAsReplied(currentMessage.id);
                        window.open(`mailto:${currentMessage.email}?subject=Re: ${currentMessage.subject || "Contact Form Message"}`, "_blank");
                      }}
                      size="sm"
                      className="bg-[#D4AF37] hover:bg-[#b8962f] text-black flex items-center gap-2 flex-1 sm:flex-none justify-center"
                    >
                      <Mail className="w-4 h-4" />
                      <span className="hidden sm:inline">Mark as Replied</span>
                      <span className="sm:hidden">Reply</span>
                    </Button>
                  )}
                </div>
                <Button
                  onClick={() => {
                    setViewingMessage(null);
                    setDeletingMessage(currentMessage.id);
                  }}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50 flex items-center gap-2 justify-center sm:ml-auto"
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
