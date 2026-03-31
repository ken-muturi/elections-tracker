import * as Yup from 'yup';

export const schema = Yup.object().shape({
  title: Yup.array()
    .of(
      Yup.object().shape({
        language: Yup.string().required("Language is required"),
        text: Yup.string().required("Title text is required"),
      })
    )
    .min(1, "At least one language text is required"),
  description: Yup.array()
    .of(
      Yup.object().shape({
        language: Yup.string().required("Description Language is required"),
        text: Yup.string().required("Description text is required"),
      })
    )
    .min(1, "At least one language text is required"),
  startDate: Yup.date()
    .required("Start date is required")
    .typeError("Start date is required"),
  endDate: Yup.date()
    .required("End date is required")
    .typeError("End date is required")
    .min(Yup.ref("startDate"), "End date cannot be before start date"),
});