import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GooglePlacesClient } from './google.places.client';

@Module({
  imports: [HttpModule],
  providers: [
    GooglePlacesClient,
    {
      provide: 'IPlacesClient',
      useClass: GooglePlacesClient,
    },
  ],
  exports: ['IPlacesClient'],
})
export class PlacesModule {}
