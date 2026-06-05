export const handler = async (event: any) => {
  event.response = {
    autoConfirmUser: true,
    autoVerifyEmail: true,
  };
  return event;
};
