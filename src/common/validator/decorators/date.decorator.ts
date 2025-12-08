import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsEndDateAfterStartDateConstraint } from '../constraints/date.validate';

/**
 * 종료일이 시작일보다 이후인지 검증하는 데코레이터
 * @param validationOptions class-validator의 validation 옵션
 *
 * @example
 * ```typescript
 * class TravelDateDto {
 *   @IsNotEmpty()
 *   @IsDateString()
 *   startDate: string;
 *
 *   @IsNotEmpty()
 *   @IsDateString()
 *   @IsEndDateAfterStartDate({ message: '여행 종료일은 시작일보다 이후여야 합니다.' })
 *   endDate: string;
 * }
 * ```
 */
export function IsEndDateAfterStartDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isEndDateAfterStartDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEndDateAfterStartDateConstraint,
    });
  };
}
