// Matches RoomResponse.java - based on actual Bruno test responses
export interface RoomResponse {
  id:          number;
  roomNumber:  string;
  floor:       number;
  roomType:    'SINGLE' | 'DOUBLE' | 'TRIPLE';
  maxCapacity: number;
  occupancy:   number;
  rentAmount:  number;
  amenities:   string | null;
  status:      'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  createdAt:   string;
  updatedAt:   string;
}

// Matches RoomRequest.java - sent to POST /rooms and PUT /rooms/{id}
export interface RoomRequest {
  roomNumber:  string;
  floor:       number;
  roomType:    string;
  maxCapacity: number;
  rentAmount:  number;
  amenities:   string;
  status:      string;
}

// Matches RoomStatsResponse.java - from GET /rooms/stats
export interface RoomStats {
  totalRooms:   number;
  occupied:     number;
  available:    number;
  maintenance:  number;
  occupancyRate: number;
}
