import { Schema, model, models } from 'mongoose';

const UserListingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    phone: { type: String, required: true }, // account phone, copied in for easy lookup

    sellerType: { type: String, enum: ['owner', 'agent'], required: true },
    listingType: { type: String, enum: ['buy', 'rent'], required: true },

    district: { type: String, required: true },
    address: String,
    lat: Number,
    lng: Number,

    title: { type: String, required: true },
    description: String,

    areaM2: Number,
    rooms: Number,
    floor: Number,
    totalFloors: Number,
    yearBuilt: Number,

    hasParking: Boolean,
    hasElevator: Boolean,
    hasWarehouse: Boolean,
    hasBalcony: Boolean,
    isFurnished: Boolean,
    hasPool: Boolean,
    hasJacuzzi: Boolean,
    hasSauna: Boolean,
    hasRooftop: Boolean,

    price: Number, // buy
    rent: Number, // rent
    deposit: Number, // rent
    priceType: { type: String, enum: ['fixed', 'negotiable'], required: true },

    tradeInterest: { type: String, enum: ['none', 'house', 'car', 'house_or_car'], default: 'none' },
    tradeNotes: String,

    email: String,
    extraPhones: [String],
    notes: String,

    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

const UserListing = models.UserListing || model('UserListing', UserListingSchema);

export default UserListing;
