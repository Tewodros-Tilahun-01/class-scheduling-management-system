import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  addRepresentative,
  updateRepresentativeInfo,
} from "@/services/UserService";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

// Define departments and years arrays
const departments = [
  "Computer Science",
  "Mathematics",
  "Physics",
  "Engineering",
  "Biology",
];
const years = [1, 2, 3, 4];

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  department: z.string().min(1, "Please select a department"),
  year: z.number().min(1, "Please select a year"),
});

export default function RepresentativeManagement() {
  const [representatives, setRepresentatives] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [edit, setEdit] = useState(false);
  const [user, setUser] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: edit
      ? user
      : {
          name: "",
          department: "",
          year: 1,
        },
  });
  const { reset } = form;

  useEffect(() => {
    const edit = searchParams.get("edit") === "true";
    const user = JSON.parse(searchParams.get("user"));

    setEdit(edit);
    setUser(() => (user !== undefined ? user : {}));

    reset({
      name: user ? user.name : "",
      department: user ? user.department : "",
      year: user ? user.year : "",
    });
  }, [searchParams]);

  const onSubmit = (data) => {
    setRepresentatives([...representatives, data]);
    form.reset();

    setIsLoading(true);
    if (edit) {
      updateRepresentativeInfo(user._id, data)
        .then(() => {
          console.log("successfully updated!");

          navigate(`${location.pathname}`);
        })
        .catch(() => {})
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      addRepresentative(data)
        .then(() => console.log("handled"))
        .catch(() => console.log("something is wrong!"))
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {edit ? "Edit " : "Add "} Class Representative
            </CardTitle>
            <CardDescription>
              Enter the details of the new class representative
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              Year {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  className="bg-green-600 hover:bg-green-500 font-bold"
                  type="submit"
                >
                  {edit ? "Edit" : "Add"} Representative
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
