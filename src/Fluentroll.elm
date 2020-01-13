port module Fluentroll exposing (main)

import Array
import Browser
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)



-- PORTS AND MAIN


main : Program () Model Msg
main =
    Browser.element
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }


port requestTranslate : String -> Cmd msg


port gotTranslation : (List Reply -> msg) -> Sub msg



-- INIT


type alias Model =
    { source : String
    , translation : String
    , replies : List Reply
    }


init : () -> ( Model, Cmd Msg )
init _ =
    ( Model "" "" []
    , Cmd.none
    )



-- UPDATE


type alias Reply =
    { source : List String
    , result : List String
    }


type Msg
    = NewInput String
    | ClearInput
    | GotTranslation (List Reply)


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NewInput newSource ->
            ( { model | source = newSource }
            , requestTranslate newSource
            )

        ClearInput ->
            ( { model | source = "", translation = "" }
            , Cmd.none
            )

        GotTranslation replies ->
            let
                newTranslation =
                    replies
                        |> List.map (\reply ->
                            String.join "" reply.result
                        )
                        |> String.join " "
            in
            ( { model
                | replies = replies, translation = newTranslation }
            , Cmd.none
            )



-- VIEW


view : Model -> Html Msg
view model =
    div []
        [ viewTextBox model
        , viewOutputText model.translation
        , viewTranslationDetails model
        ]


viewTextBox : Model -> Html Msg
viewTextBox model =
    div [ class "field is-grouped" ]
        [ p [ class "control is-expanded" ]
            [ input
                [ type_ "text"
                , class "input"
                , placeholder "Type in your text"
                , value model.source
                , onInput NewInput
                ]
                []
            ]
        , p [ class "control" ]
            [ button
                [ class "button"
                , onClick ClearInput
                ]
                [ text "Clear" ]
            ]
        ]


viewOutputText : String -> Html msg
viewOutputText translation =
    p [ class "subtitle" ] [ text translation ]


viewTranslationDetails : Model -> Html msg
viewTranslationDetails model =
    let
        { replies } =
            model

        viewCells tokens =
            tokens
                |> List.map (\tok -> td [] [ text tok ])

        viewTokenMap reply =
            table
                [ class "table is-narrow" ]
                [ tbody
                    []
                    [ tr [] <| viewCells reply.source
                    , tr [] <| viewCells reply.result
                    ]
                ]

        viewDetails =
            List.map viewTokenMap replies

    in
    if String.isEmpty model.translation then
        text ""
    else
        details [] <|
            List.concat
                [ [ summary [] [ text "Show tokens" ] ]
                , viewDetails
                ]



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    gotTranslation GotTranslation



-- UTILITIES


zip : List a -> b -> List b -> List (a, b)
zip xs b ys =
    xs
        |> List.indexedMap (\i ->
            \a ->
                Array.fromList ys
                    |> Array.get i
                    |> Maybe.withDefault b
                    |> Tuple.pair a
        )
