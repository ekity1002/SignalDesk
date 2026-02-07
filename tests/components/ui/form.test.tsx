import "@testing-library/jest-dom/vitest";
import { zodResolver } from "@hookform/resolvers/zod";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";

const testSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
});

type TestFormData = z.infer<typeof testSchema>;

function TestForm({ onSubmit }: { onSubmit: (data: TestFormData) => void }) {
  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      email: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} data-testid="test-form">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <input {...field} data-testid="email-input" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <button type="submit">Submit</button>
      </form>
    </Form>
  );
}

describe("Form components", () => {
  it("should render form with label", () => {
    render(<TestForm onSubmit={() => {}} />);

    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByTestId("email-input")).toBeInTheDocument();
  });

  it("should display validation error message", async () => {
    const user = userEvent.setup();
    render(<TestForm onSubmit={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(screen.getByText("Email is required")).toBeInTheDocument();
    });
  });

  it("should display format validation error", async () => {
    const user = userEvent.setup();
    render(<TestForm onSubmit={() => {}} />);

    await user.type(screen.getByTestId("email-input"), "invalid-email");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email")).toBeInTheDocument();
    });
  });

  it("should call onSubmit with valid data", async () => {
    const user = userEvent.setup();
    let submittedData: TestFormData | null = null;

    render(
      <TestForm
        onSubmit={(data) => {
          submittedData = data;
        }}
      />,
    );

    await user.type(screen.getByTestId("email-input"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(submittedData).toEqual({ email: "test@example.com" });
    });
  });

  it("should apply error styles to label when field has error", async () => {
    const user = userEvent.setup();
    render(<TestForm onSubmit={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      const label = screen.getByText("Email");
      expect(label).toHaveClass("text-destructive");
    });
  });
});
