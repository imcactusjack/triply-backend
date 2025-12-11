export interface PlaceCoordinate {
  latitude: number;
  longitude: number;
}

export interface PlaceDetail extends PlaceCoordinate {
  rating?: number;
  userRatingsTotal?: number;
  openingHoursText?: string[];
  openingNow?: boolean;
  placeId?: string;
  formattedAddress?: string;
}

export interface IPlacesClient {
  /**
   * 장소 검색 쿼리를 기반으로 좌표 정보를 가져옵니다.
   * @param query 장소 검색 쿼리 (예: "스타벅스 홍대입구역점, Seoul")
   * @returns 좌표 정보 (없으면 null 반환)
   */
  getPlaceCoordinates(query: string): Promise<PlaceCoordinate | null>;

  /**
   * 장소 검색 쿼리를 기반으로 좌표 및 부가 정보를 가져옵니다.
   * @param query 장소 검색 쿼리 (예: "스타벅스 홍대입구역점, Seoul")
   * @returns 좌표, 평점, 영업시간 등 (없으면 null 반환)
   */
  getPlaceDetails(query: string): Promise<PlaceDetail | null>;
}
