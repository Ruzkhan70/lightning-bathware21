import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";
import { Tag, Plus, Edit, Trash2, Calendar, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface OfferWithStatus {
  offer: import("../../context/AdminContext").Offer;
  status: "active" | "expired" | "scheduled";
  timeRemaining: string;
}

export default function AdminOffers() {
  const navigate = useNavigate();
  const { offers, products, deleteOffer } = useAdmin();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getOfferStatus = (offer: import("../../context/AdminContext").Offer): OfferWithStatus => {
    const now = new Date();
    const start = new Date(offer.startDate);
    const end = new Date(offer.endDate);

    let status: "active" | "expired" | "scheduled";
    let timeRemaining = "";

    if (now < start) {
      status = "scheduled";
      const diff = start.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      timeRemaining = `${days}d ${hours}h`;
    } else if (now >= start && now <= end && offer.isEnabled) {
      status = "active";
      const diff = end.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      timeRemaining = `${days}d ${hours}h ${minutes}m`;
    } else {
      status = "expired";
      timeRemaining = "Ended";
    }

    return { offer, status, timeRemaining };
  };

  const getApplicableProducts = (productIds: string[]) => {
    const productNames = productIds
      .map((id) => products.find((p) => p.id === id)?.name)
      .filter(Boolean);
    return productNames;
  };

  const handleDeleteClick = (offerId: string) => {
    setOfferToDelete(offerId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (offerToDelete) {
      deleteOffer(offerToDelete);
      setDeleteDialogOpen(false);
      setOfferToDelete(null);
    }
  };

  const offersWithStatus: OfferWithStatus[] = offers.map(getOfferStatus);

  const activeOffers = offersWithStatus.filter((o) => o.status === "active");
  const scheduledOffers = offersWithStatus.filter((o) => o.status === "scheduled");
  const expiredOffers = offersWithStatus.filter((o) => o.status === "expired");

  const getStatusBadge = (status: "active" | "expired" | "scheduled") => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case "expired":
        return <Badge className="bg-red-500 hover:bg-red-600">Expired</Badge>;
      case "scheduled":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Scheduled</Badge>;
    }
  };

  const getDiscountBadge = (offer: import("../../context/AdminContext").Offer) => {
    if (offer.discountPercentage) {
      return (
        <Badge variant="outline" className="border-purple-500 text-purple-600">
          <Percent className="w-3 h-3 mr-1" />
          {offer.discountPercentage}%
        </Badge>
      );
    }
    if (offer.promotionalPrice !== undefined) {
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-600">
          Rs. {offer.promotionalPrice.toLocaleString()}
        </Badge>
      );
    }
    return null;
  };

  const renderOfferCard = (offerWithStatus: OfferWithStatus) => {
    const { offer, status, timeRemaining } = offerWithStatus;
    const applicableProducts = getApplicableProducts(offer.applicableProducts);

    return (
      <Card key={offer.id} className="p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="font-semibold text-gray-900">{offer.title}</h3>
          </div>
          {getStatusBadge(status)}
        </div>

        <p className="text-sm text-gray-600 mb-3">{offer.description}</p>

        <div className="flex flex-wrap gap-2 mb-3">
          {getDiscountBadge(offer)}
        </div>

        <div className="space-y-2 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(offer.startDate).toLocaleDateString()} -{" "}
              {new Date(offer.endDate).toLocaleDateString()}
            </span>
          </div>
          {status === "active" && (
            <div className="text-green-600 font-medium">
              Time remaining: {timeRemaining}
            </div>
          )}
          {status === "scheduled" && (
            <div className="text-yellow-600 font-medium">
              Starts in: {timeRemaining}
            </div>
          )}
          {status === "expired" && (
            <div className="text-red-600 font-medium">{timeRemaining}</div>
          )}
        </div>

        {applicableProducts.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Applies to:</p>
            <div className="flex flex-wrap gap-1">
              {applicableProducts.slice(0, 3).map((name, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {name}
                </Badge>
              ))}
              {applicableProducts.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{applicableProducts.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/offers/add/${offer.id}`)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeleteClick(offer.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-6 h-6 text-[#D4AF37]" />
          <h1 className="text-2xl font-bold text-gray-900">Offers</h1>
        </div>
        <Button onClick={() => navigate("/admin/offers/add")}>
          <Plus className="w-4 h-4 mr-2" />
          Add Offer
        </Button>
      </div>

      {/* Active Offers */}
      {activeOffers.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            Active Offers ({activeOffers.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeOffers.map(renderOfferCard)}
          </div>
        </div>
      )}

      {/* Scheduled Offers */}
      {scheduledOffers.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            Scheduled Offers ({scheduledOffers.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scheduledOffers.map(renderOfferCard)}
          </div>
        </div>
      )}

      {/* Expired Offers */}
      {expiredOffers.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            Expired Offers ({expiredOffers.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expiredOffers.map(renderOfferCard)}
          </div>
        </div>
      )}

      {offers.length === 0 && (
        <div className="text-center py-12">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No offers yet</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/admin/offers/add")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add your first offer
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Offer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this offer? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
