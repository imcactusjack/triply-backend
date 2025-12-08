import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

/**
 * 종료일이 시작일보다 이후인지 검증하는 제약 조건
 * 객체에 startDate 속성이 있어야 합니다.
 */
@ValidatorConstraint({ name: 'isEndDateAfterStartDate', async: false })
export class IsEndDateAfterStartDateConstraint implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments): boolean {
    const object = args.object as any;
    const startDate = object.startDate;

    // startDate나 endDate가 없으면 다른 validator에서 처리하도록 true 반환
    if (!startDate || !endDate) {
      return true;
    }

    return new Date(endDate) > new Date(startDate);
  }

  defaultMessage(args: ValidationArguments): string {
    return '종료일은 시작일보다 이후여야 합니다.';
  }
}
