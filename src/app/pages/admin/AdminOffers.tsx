import { useState } from "react";
import { useNavigate } from "react-router";
import { useAdmin } from "../../context/AdminContext";
import { Button } from "../../components/ui/button";
import {
  Plus,
  Edit,
  Trash2,
  Tag,
  Calendar,
  Power,
  PowerOff,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminOffers() {
  const navigate = useNavigate();
  const { offers, deleteOffer, toggleOfferStatus, toggleOffersPage, siteContent, addDemoOffers } = useAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [showDisabled, setShowDisabled] = useState(false);
  const isOffersPageEnabled = siteContent?.offers?.isEnabled ?? true;

  const safeOffers = offers || [];

  const filteredOffers = safeOffers.filter((offer) =>
    offer.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (showDisabled || offer.isEnabled !== false)
  );

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteOffer(id);
      toast.success("Offer deleted successfully");
    }
  };

  const handleToggleStatus = (id: string, title: string, isEnabled: boolean) => {
    toggleOfferStatus(id);
    toast.success(
      `${title} ${isEnabled ? "disabled" : "enabled"} successfully`
    );
  };

  const isOfferActive = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return false;
    const now = new Date();
    return new Date(startDate) <= now && new Date(endDate) >= now;
  };

  const formatDateSafe = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Invalid date";
      return date.toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Special Offers</h1>
          <p className="text-gray-600">
            Manage promotional offers and discounts
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Offers Page:</span>
            <button
              onClick={() => {
                toggleOffersPage();
                toast.success(isOffersPageEnabled ? "Offers page disabled" : "Offers page enabled");
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isOffersPageEnabled ? "bg-green-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isOffersPageEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isOffersPageEnabled ? "text-green-600" : "text-gray-500"}`}>
              {isOffersPageEnabled ? "ON" : "OFF"}
            </span>
          </div>
          <Button
            onClick={() => navigate("/admin/add-offer")}
            className="bg-[#D4AF37] hover:bg-[#C5A028] text-black"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Offer
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search offers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
        />
        <Button
          variant="outline"
          onClick={() => setShowDisabled(!showDisabled)}
          className={showDisabled ? "text-purple-600 border-purple-500" : "text-gray-500"}
        >
          {showDisabled ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {showDisabled ? "Hide Disabled" : "Show Disabled"}
        </Button>
      </div>

      {/* Offers Grid */}
      {filteredOffers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Tag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 mb-4">
            {searchTerm ? "No offers found" : "No offers yet"}
          </p>
          {!searchTerm && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate("/admin/add-offer")}
                className="bg-black hover:bg-[#D4AF37] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Offer
              </Button>
              <Button
                onClick={addDemoOffers}
                variant="outline"
                className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Demo Offers
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOffers.map((offer) => {
            const isActive = isOfferActive(offer.startDate, offer.endDate);
            const isPast = new Date(offer.endDate) < new Date();

            return (
              <div
                key={offer.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border-2 border-gray-100"
              >
                {/* Banner Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={offer.bannerImage}
                    alt={offer.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    {offer.isEnabled ? (
                      <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <Power className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <PowerOff className="w-3 h-3" />
                        Disabled
                      </span>
                    )}
                    {isActive && offer.isEnabled && (
                      <span className="px-3 py-1 bg-[#D4AF37] text-black text-xs font-bold rounded-full">
                        Live Now
                      </span>
                    )}
                    {isPast && (
                      <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                        Expired
                      </span>
                    )}
                  </div>
                  {offer.discountPercentage && (
                    <div className="absolute top-3 left-3">
                      <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-lg shadow-lg">
                        -{offer.discountPercentage}%
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-xl font-bold mb-2 line-clamp-1">
                    {offer.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {offer.description}
                  </p>

                  {/* Dates */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {formatDateSafe(offer.startDate)} - {formatDateSafe(offer.endDate)}
                    </span>
                  </div>

                  {/* Products Count */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <Tag className="w-4 h-4" />
                    <span>
                      {offer.applicableProducts.length} product
                      {offer.applicableProducts.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => navigate(`/admin/edit-offer/${offer.id}`)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      onClick={() =>
                        handleToggleStatus(offer.id, offer.title, offer.isEnabled)
                      }
                      variant="outline"
                      size="sm"
                      className={
                        offer.isEnabled
                          ? "flex-1 text-red-600 hover:text-red-700"
                          : "flex-1 text-green-600 hover:text-green-700"
                      }
                    >
                      {offer.isEnabled ? (
                        <>
                          <PowerOff className="w-4 h-4 mr-1" />
                          Disable
                        </>
                      ) : (
                        <>
                          <Power className="w-4 h-4 mr-1" />
                          Enable
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleDelete(offer.id, offer.title)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}