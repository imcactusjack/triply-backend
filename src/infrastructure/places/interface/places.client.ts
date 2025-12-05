export interface PlaceCoordinates {
  latitude: number;
  longitude: number;
}

export interface IPlacesClient {
  /**
   * 장소 검색 쿼리를 기반으로 좌표 정보를 가져옵니다.
   * @param query 장소 검색 쿼리 (예: "스타벅스 홍대입구역점, Seoul")
   * @returns 좌표 정보 (없으면 null 반환)
   */
  getPlaceCoordinates(query: string): Promise<PlaceCoordinates | null>;
}
